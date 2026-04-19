#!/usr/bin/env node

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import patternsJson from "../src/lib/form-patterns.json";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local") });

type Applicability = "realtime" | "post_set_only" | "not_applicable";
type View = "front" | "side" | "three_quarter";

interface CsvExerciseRow {
  exercise_id: string;
  name: string;
  instructions: string[];
  equipments: string[];
  target_muscles: string[];
  body_parts: string[];
  secondary_muscles: string[];
}

interface PatternPrimaryMetric {
  kind: "angle";
  landmarks: [number, number, number];
  phaseLogic?: "flexion_extension" | "extension_flexion" | "pull_raise_lower" | "cyclic";
}

interface PatternDefinition {
  id: string;
  label: string;
  applicability: Applicability;
  view: View;
  primaryMetric: PatternPrimaryMetric;
  rules: Array<{
    id: string;
    landmarks: [number, number, number];
    phase: "eccentric" | "concentric" | "both";
    min: number;
    max: number;
    severity: "error" | "warning" | "info";
    holdFrames: number;
    visibilityThreshold: number;
    cue: string;
  }>;
}

interface GeneratedFormRules {
  patternId: string;
  applicability: Applicability;
  view: View;
  confidence: number;
  primaryMetric: PatternPrimaryMetric;
  overrides: {
    disabledRuleIds: string[];
    ruleThresholds: Array<{
      ruleId: string;
      min?: number;
      max?: number;
    }>;
    cueOverrides: Array<{
      ruleId: string;
      cue: string;
    }>;
  };
  review: {
    status: "ai_generated" | "reviewed" | "needs_review";
    notes?: string;
  };
}

interface GeneratedRow {
  exercise_id: string;
  form_rules: GeneratedFormRules;
}

interface RawGeneratedResult {
  exercise_id: string;
  patternId?: string;
  applicability?: Applicability;
  view?: View;
  confidence?: number;
  primaryMetric?: PatternPrimaryMetric;
  overrides?: GeneratedFormRules["overrides"];
  review?: GeneratedFormRules["review"];
  form_rules?: GeneratedFormRules;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INPUT_CSV = resolve(ROOT, "exercises_rows.csv");
const OUTPUT_DIR = resolve(ROOT, "generated", "form-rules");
const OUTPUT_NDJSON = resolve(OUTPUT_DIR, "exercise_form_rules.ndjson");
const OUTPUT_CSV = resolve(OUTPUT_DIR, "exercise_form_rules.csv");
const OUTPUT_REPORT = resolve(OUTPUT_DIR, "report.json");
const OUTPUT_PATTERNS = resolve(OUTPUT_DIR, "form-patterns.json");
const OUTPUT_LAST_RESPONSE = resolve(OUTPUT_DIR, "last-openrouter-response.txt");

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

const CHAT_MODELS = [
  process.env.OPENROUTER_CHAT_MODEL,
  process.env.OPENROUTER_FALLBACK_MODEL,
  process.env.OPENROUTER_FALLBACK_MODEL_2,
  process.env.OPENROUTER_FALLBACK_MODEL_3,
  process.env.OPENROUTER_FALLBACK_MODEL_4,
  process.env.OPENROUTER_FALLBACK_MODEL_5,
  process.env.OPENROUTER_FALLBACK_MODEL_6,
  process.env.OPENROUTER_FALLBACK_MODEL_LAST,
].filter(Boolean) as string[];

const PATTERNS = patternsJson as unknown as PatternDefinition[];
const PATTERN_IDS = PATTERNS.map((pattern) => pattern.id);
const DEFAULT_BATCH_SIZE = 50;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    batchSize: DEFAULT_BATCH_SIZE,
    limit: undefined as number | undefined,
    offset: 0,
    apply: false,
    localOnly: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--batch-size" && args[i + 1]) options.batchSize = parseInt(args[++i], 10);
    else if (arg === "--limit" && args[i + 1]) options.limit = parseInt(args[++i], 10);
    else if (arg === "--offset" && args[i + 1]) options.offset = parseInt(args[++i], 10);
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--local-only") options.localOnly = true;
  }

  return options;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseJsonArray(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

async function readExercisesFromCsv(csvPath: string): Promise<CsvExerciseRow[]> {
  const raw = await readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      exercise_id: row.exercise_id,
      name: row.name,
      instructions: parseJsonArray(row.instructions),
      equipments: parseJsonArray(row.equipments),
      target_muscles: parseJsonArray(row.target_muscles),
      body_parts: parseJsonArray(row.body_parts),
      secondary_muscles: parseJsonArray(row.secondary_muscles),
    };
  });
}

function buildPrompt(batch: CsvExerciseRow[]): string {
  return [
    "Classify each exercise into exactly one known pattern and return JSON only.",
    `Allowed pattern ids: ${PATTERN_IDS.join(", ")}`,
    "Allowed applicability values: realtime, post_set_only, not_applicable.",
    "Allowed view values: front, side, three_quarter.",
    "Do not emit the full pattern rules. Emit only exercise mapping plus overrides.",
    "Use only these fields per result: exercise_id, patternId, applicability, view, confidence, primaryMetric, overrides, review.",
    "overrides must contain disabledRuleIds, ruleThresholds, cueOverrides arrays.",
    "If the exercise is a stretch, yoga pose, warmup, or mobility drill, prefer not_applicable or post_set_only.",
    "If confidence is below 0.75, set review.status to needs_review. Otherwise use ai_generated.",
    "Return a JSON object with a single property named results that is an array.",
    "",
    ...batch.map((exercise) => JSON.stringify({
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      instructions: exercise.instructions,
      equipments: exercise.equipments,
      target_muscles: exercise.target_muscles,
      body_parts: exercise.body_parts,
      secondary_muscles: exercise.secondary_muscles,
    })),
  ].join("\n");
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing.");
  }
  if (CHAT_MODELS.length === 0) {
    throw new Error("No OpenRouter chat model configured.");
  }

  let lastError: Error | null = null;
  for (const model of CHAT_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Workout Tracker Pattern Form Rules Generator",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a biomechanics classifier. Return compact JSON only.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty model response.");
      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("All OpenRouter models failed.");
}

async function parseJsonResponse(content: string): Promise<{ results: RawGeneratedResult[] }> {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

  const candidates = [
    trimmed,
    extractBalancedJson(trimmed, "{", "}"),
    extractBalancedJson(trimmed, "[", "]"),
  ].filter((value): value is string => Boolean(value));

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { results?: RawGeneratedResult[] } | RawGeneratedResult[];
      if (Array.isArray(parsed)) {
        return { results: parsed };
      }
      if (Array.isArray(parsed.results)) {
        return { results: parsed.results };
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_LAST_RESPONSE, content, "utf8");
  throw new Error(
    `Failed to parse model JSON response. Saved raw output to ${OUTPUT_LAST_RESPONSE}. ${lastError ? lastError.message : ""}`.trim(),
  );
}

function extractBalancedJson(content: string, openChar: "{" | "[", closeChar: "}" | "]"): string | null {
  const start = content.indexOf(openChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const char = content[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;

    if (depth === 0) {
      return content.slice(start, index + 1);
    }
  }

  return null;
}

function normalizeGeneratedResult(row: RawGeneratedResult): GeneratedRow {
  if (row.form_rules) {
    return {
      exercise_id: row.exercise_id,
      form_rules: row.form_rules,
    };
  }

  return {
    exercise_id: row.exercise_id,
    form_rules: {
      patternId: row.patternId ?? "",
      applicability: row.applicability ?? "not_applicable",
      view: row.view ?? "side",
      confidence: row.confidence ?? 0,
      primaryMetric: row.primaryMetric ?? {
        kind: "angle",
        landmarks: [11, 13, 15],
      },
      overrides: row.overrides ?? {
        disabledRuleIds: [],
        ruleThresholds: [],
        cueOverrides: [],
      },
      review: row.review ?? {
        status: "needs_review",
        notes: "",
      },
    },
  };
}

function sanitizeGeneratedRow(rawRow: RawGeneratedResult): GeneratedRow {
  const row = normalizeGeneratedResult(rawRow);
  const pattern = PATTERNS.find((entry) => entry.id === row.form_rules.patternId);
  if (!pattern) throw new Error(`Unknown pattern id: ${row.form_rules.patternId}`);

  const confidence = Math.min(1, Math.max(0, Number(row.form_rules.confidence ?? 0)));
  const primaryMetric = row.form_rules.primaryMetric ?? pattern.primaryMetric;

  return {
    exercise_id: row.exercise_id,
    form_rules: {
      patternId: pattern.id,
      applicability: row.form_rules.applicability ?? pattern.applicability,
      view: row.form_rules.view ?? pattern.view,
      confidence,
      primaryMetric: {
        kind: "angle",
        landmarks: primaryMetric.landmarks,
        phaseLogic: primaryMetric.phaseLogic,
      },
      overrides: {
        disabledRuleIds: Array.isArray(row.form_rules.overrides?.disabledRuleIds)
          ? row.form_rules.overrides.disabledRuleIds.filter((ruleId) => pattern.rules.some((rule) => rule.id === ruleId))
          : [],
        ruleThresholds: Array.isArray(row.form_rules.overrides?.ruleThresholds)
          ? row.form_rules.overrides.ruleThresholds.filter((override) => pattern.rules.some((rule) => rule.id === override.ruleId))
          : [],
        cueOverrides: Array.isArray(row.form_rules.overrides?.cueOverrides)
          ? row.form_rules.overrides.cueOverrides.filter((override) => pattern.rules.some((rule) => rule.id === override.ruleId))
          : [],
      },
      review: {
        status: confidence < 0.75 ? "needs_review" : (row.form_rules.review?.status ?? "ai_generated"),
        notes: row.form_rules.review?.notes ?? "",
      },
    },
  };
}

function heuristicPatternForExercise(exercise: CsvExerciseRow): GeneratedRow {
  const text = [
    exercise.name,
    ...exercise.instructions,
    ...exercise.equipments,
    ...exercise.target_muscles,
    ...exercise.body_parts,
    ...exercise.secondary_muscles,
  ].join(" ").toLowerCase();

  let patternId = "mobility";
  let applicability: Applicability = "not_applicable";
  let view: View = "side";
  let confidence = 0.72;
  let notes = "Heuristic classification.";

  if (/(stretch|yoga|pose|warm up|mobility|rolling|release)/.test(text)) {
    patternId = "mobility";
    applicability = "not_applicable";
    confidence = 0.95;
    notes = "Heuristic mobility/stretch classification.";
  } else if (/(carry|walk|march|farmer|suitcase)/.test(text)) {
    patternId = "carry";
    applicability = "post_set_only";
    view = "front";
    confidence = 0.88;
    notes = "Heuristic carry classification.";
  } else if (/(curl|concentration curl|hammer curl|preacher)/.test(text)) {
    patternId = "curl";
    applicability = "realtime";
    confidence = 0.92;
    notes = "Heuristic curl classification.";
  } else if (/(triceps extension|skull crusher|pushdown|kickback|dip)/.test(text)) {
    patternId = "triceps_extension";
    applicability = "realtime";
    confidence = 0.85;
    notes = "Heuristic triceps classification.";
  } else if (/(lateral raise|raise to side|side raise)/.test(text)) {
    patternId = "lateral_raise";
    applicability = "realtime";
    view = "front";
    confidence = 0.95;
    notes = "Heuristic lateral raise classification.";
  } else if (/(calf raise|heel raise|standing calf|seated calf)/.test(text)) {
    patternId = "calf_raise";
    applicability = "realtime";
    confidence = 0.95;
    notes = "Heuristic calf raise classification.";
  } else if (/(lunge|split squat|step up|bulgarian)/.test(text)) {
    patternId = "lunge";
    applicability = "realtime";
    confidence = 0.9;
    notes = "Heuristic lunge classification.";
  } else if (/(deadlift|hinge|good morning|romanian|rdl|kettlebell swing|pull through)/.test(text)) {
    patternId = "hinge";
    applicability = "realtime";
    confidence = 0.9;
    notes = "Heuristic hinge classification.";
  } else if (/(squat|leg press|goblet|front squat|back squat|hack squat|wall sit)/.test(text)) {
    patternId = "squat";
    applicability = "realtime";
    confidence = 0.88;
    notes = "Heuristic squat classification.";
  } else if (/(pull up|chin up|lat pulldown|pull-down|pulldown)/.test(text)) {
    patternId = "vertical_pull";
    applicability = "realtime";
    view = "front";
    confidence = 0.9;
    notes = "Heuristic vertical pull classification.";
  } else if (/(row|rear delt row|bent over row|seated row)/.test(text)) {
    patternId = "horizontal_pull";
    applicability = "realtime";
    confidence = 0.9;
    notes = "Heuristic horizontal pull classification.";
  } else if (/(overhead press|shoulder press|military press|handstand push)/.test(text)) {
    patternId = "vertical_push";
    applicability = "realtime";
    confidence = 0.9;
    notes = "Heuristic vertical push classification.";
  } else if (/(push-up|push up|bench press|chest press|dip|press)/.test(text)) {
    patternId = "horizontal_push";
    applicability = "realtime";
    confidence = 0.84;
    notes = "Heuristic horizontal push classification.";
  }

  const pattern = PATTERNS.find((entry) => entry.id === patternId) ?? PATTERNS.find((entry) => entry.id === "mobility")!;
  return {
    exercise_id: exercise.exercise_id,
    form_rules: {
      patternId: pattern.id,
      applicability,
      view,
      confidence,
      primaryMetric: pattern.primaryMetric,
      overrides: {
        disabledRuleIds: [],
        ruleThresholds: [],
        cueOverrides: [],
      },
      review: {
        status: confidence < 0.8 ? "needs_review" : "ai_generated",
        notes,
      },
    },
  };
}

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

async function writeOutputs(rows: GeneratedRow[], report: Record<string, unknown>) {
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(OUTPUT_PATTERNS, JSON.stringify(PATTERNS, null, 2));
  await writeFile(OUTPUT_NDJSON, rows.map((row) => JSON.stringify(row)).join("\n"));
  await writeFile(
    OUTPUT_CSV,
    [
      "exercise_id,form_rules_json",
      ...rows.map((row) => `${row.exercise_id},${escapeCsvValue(JSON.stringify(row.form_rules))}`),
    ].join("\n"),
  );
  await writeFile(OUTPUT_REPORT, JSON.stringify(report, null, 2));
}

async function applyRowsToSupabase(rows: GeneratedRow[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.");
  }

  const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  for (const row of rows) {
    const { error } = await supabase
      .from("exercises")
      .update({ form_rules: row.form_rules })
      .eq("exercise_id", row.exercise_id);

    if (error) {
      throw new Error(`Failed to update ${row.exercise_id}: ${error.message}`);
    }
  }
}

async function main() {
  const options = parseArgs();
  const allRows = await readExercisesFromCsv(INPUT_CSV);
  const selectedRows = allRows.slice(options.offset, options.limit ? options.offset + options.limit : undefined);

  if (selectedRows.length === 0) {
    console.log("No exercise rows selected.");
    return;
  }

  const outputRows: GeneratedRow[] = [];
  const report = {
    totalRows: selectedRows.length,
    realtime: 0,
    post_set_only: 0,
    not_applicable: 0,
    lowConfidence: 0,
    failed: 0,
  };

  for (let index = 0; index < selectedRows.length; index += options.batchSize) {
    const batch = selectedRows.slice(index, index + options.batchSize);
    console.log(`Processing batch ${Math.floor(index / options.batchSize) + 1} (${batch.length} rows)`);

    const rawResults = options.localOnly
      ? batch.map((exercise) => ({
          exercise_id: exercise.exercise_id,
          form_rules: heuristicPatternForExercise(exercise).form_rules,
        }))
      : (await parseJsonResponse(await callOpenRouter(buildPrompt(batch)))).results;

    for (const row of rawResults) {
      try {
        const sanitized = sanitizeGeneratedRow(row);
        outputRows.push(sanitized);

        if (sanitized.form_rules.applicability === "realtime") report.realtime += 1;
        else if (sanitized.form_rules.applicability === "post_set_only") report.post_set_only += 1;
        else report.not_applicable += 1;

        if (sanitized.form_rules.confidence < 0.75) report.lowConfidence += 1;
      } catch (error) {
        report.failed += 1;
        console.warn(`Skipping ${row.exercise_id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await writeOutputs(outputRows, report);
  console.log(`Wrote ${outputRows.length} rows to ${OUTPUT_NDJSON}`);

  if (options.apply) {
    await applyRowsToSupabase(outputRows);
    console.log("Applied generated form_rules to Supabase.");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
