#!/usr/bin/env node
// ── Generate Form Rules for All Exercises ─────────────────────────────────────
// One-time script. Fetches all exercises from Supabase, sends each to OpenRouter
// with a prompt to generate MediaPipe-based form checking rules, then saves
// the JSON back to the exercises table.
//
// Usage: npx tsx scripts/generate-form-rules.ts
// ─────────────────────────────────────────────────────────────────────────────

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local from project root
config({ path: resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL ?? "qwen/qwen3.6-plus:free";

// MediaPipe Pose 33 landmark reference (the ones we care about for form checking)
const LANDMARK_REFERENCE = `
MediaPipe Pose 33 Landmarks (index: name):
  0=nose, 1=L eye inner, 2=L eye, 3=L eye outer, 4=R eye inner, 5=R eye, 6=R eye outer
  7=L ear, 8=R ear, 9=L mouth, 10=R mouth
  11=L shoulder, 12=R shoulder
  13=L elbow, 14=R elbow
  15=L wrist, 16=R wrist
  17=L pinky, 18=R pinky, 19=L index, 20=R index, 21=L thumb, 22=R thumb
  23=L hip, 24=R hip
  25=L knee, 26=R knee
  27=L ankle, 28=R ankle
  29=L heel, 30=R heel
  31=L foot index, 32=R foot index
`;

const RULE_SCHEMA_DESCRIPTION = `{
  "rules": [
    {
      "name": "short descriptive name of the angle check",
      "landmarks": [a, b, c],
      "description": "what joint movement this tracks",
      "phase": "eccentric|concentric|both",
      "min": 0,
      "max": 180,
      "cue": "short instruction shown to user when angle is out of range"
    }
  ],
  "tempo": {
    "eccentricSeconds": 2,
    "pauseSeconds": 0,
    "concentricSeconds": 1
  }
}

landmarks is an array of 3 MediaPipe landmark indices.
The angle is calculated at landmark[1] (the vertex) between landmark[0] and landmark[2].
min and max are in degrees (0-180). The rule triggers a cue when the angle is OUTSIDE this range.
phase indicates when to check: "eccentric" (lowering), "concentric" (lifting), or "both".
tempo suggests ideal rep timing (seconds).`;

const SYSTEM_PROMPT = `You are a biomechanics expert and personal trainer. Your job is to analyze exercise instructions and generate form-checking rules based on MediaPipe Pose landmarks.

${LANDMARK_REFERENCE}

Output JSON schema:
${RULE_SCHEMA_DESCRIPTION}

Rules for generating:
1. Generate 3-5 critical angle rules that catch the MOST COMMON form mistakes for this exercise.
2. Focus on safety-critical joints: knees, elbows, spine, shoulders.
3. Angles should be realistic ranges based on human biomechanics.
4. Cues should be short (under 40 chars) and action-oriented.
5. If the exercise is a stretch, mobility, or cardio movement where static angles don't apply, set "rules" to an empty array.
6. If the exercise uses a machine with variable setup, generate only universal rules (spine neutrality, symmetry).
7. NEVER invent instructions — only use the provided instructions and exercise metadata.

Return ONLY valid JSON. No markdown, no explanation.`;

function buildPrompt(exercise: {
  name: string;
  target_muscles?: string[];
  body_parts?: string[];
  equipments?: string[];
  instructions?: string[];
}): string {
  return `Exercise: ${exercise.name}
Target muscles: ${(exercise.target_muscles ?? []).join(", ") || "N/A"}
Body parts: ${(exercise.body_parts ?? []).join(", ") || "N/A"}
Equipment: ${(exercise.equipments ?? []).join(", ") || "bodyweight"}
Instructions:
${(exercise.instructions ?? ["No instructions available."]).map((s: string, i: number) => `  ${i + 1}. ${s}`).join("\n")}

Generate form rules:`;
}

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "FitPulse Form Rules Generator",
    },
    body: JSON.stringify({
      model: OPENROUTER_CHAT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API ${res.status}: ${errText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJsonResponse(content: string): Record<string, unknown> | null {
  // Strip markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // Find the first { and last } to extract JSON from messy output
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    console.warn("  ⚠ No JSON object found in response");
    return null;
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.warn("  ⚠ Failed to parse JSON response");
    return null;
  }
}

function validateRules(rules: Record<string, unknown>): boolean {
  if (!rules || typeof rules !== "object") return false;

  const rulesArray = rules.rules;
  // Must have rules array (can be empty for exercises where angles don't apply)
  if (!Array.isArray(rulesArray)) return false;

  for (const rule of rulesArray) {
    if (typeof rule !== "object" || rule === null) return false;
    const r = rule as Record<string, unknown>;
    if (!r.landmarks || !Array.isArray(r.landmarks) || (r.landmarks as number[]).length !== 3) {
      return false;
    }
    if (typeof r.min !== "number" || typeof r.max !== "number") return false;
    if (!r.cue || typeof r.cue !== "string") return false;
    // Landmark indices should be valid MediaPipe indices (0-32)
    if ((r.landmarks as number[]).some((l: number) => l < 0 || l > 32)) return false;
  }

  // Tempo is optional but should be valid if present
  if (rules.tempo && typeof rules.tempo !== "object") return false;

  return true;
}

async function processExercise(
  exercise: {
    exercise_id: string;
    name: string;
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
    instructions?: string[];
  },
  supabase: ReturnType<typeof createClient>,
  index: number,
  total: number,
): Promise<"success" | "skipped" | "failed"> {
  console.log(`\n[${index + 1}/${total}] ${exercise.name}`);

  try {
    const response = await callOpenRouter([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(exercise) },
    ]);

    const rules = parseJsonResponse(response);

    if (!rules) {
      console.log("  ⚠ Invalid response, skipping");
      return "failed";
    }

    if (!validateRules(rules)) {
      console.log("  ⚠ Validation failed, skipping");
      return "failed";
    }

    const typedRules = rules as {
      rules: Array<{ landmarks: number[]; min: number; max: number; cue: string }>;
      tempo?: { eccentricSeconds: number; pauseSeconds: number; concentricSeconds: number };
    };

    if (typedRules.rules.length === 0) {
      console.log("  ⊘ No applicable rules (cardio/stretch/machine)");
      const { error: updateErr } = await supabase
        .from("exercises")
        .update({ form_rules: { applicable: false } })
        .eq("exercise_id", exercise.exercise_id);

      if (updateErr) {
        console.log("  ✗ DB update error:", updateErr.message);
        return "failed";
      }
      return "skipped";
    }

    const { error: updateErr } = await supabase
      .from("exercises")
      .update({ form_rules: rules })
      .eq("exercise_id", exercise.exercise_id);

    if (updateErr) {
      console.log("  ✗ DB update error:", updateErr.message);
      return "failed";
    }

    console.log(`  ✓ Generated ${typedRules.rules.length} rules`);
    if (typedRules.tempo) {
      console.log(`    Tempo: ${typedRules.tempo.eccentricSeconds}s eccentric, ${typedRules.tempo.pauseSeconds}s pause, ${typedRules.tempo.concentricSeconds}s concentric`);
    }
    return "success";
  } catch (err) {
    console.log("  ✗ Error:", err instanceof Error ? err.message : err);
    return "failed";
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.");
    console.error("Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (get it from Supabase Dashboard > Settings > API).");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("Fetching exercises without form rules...");
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("exercise_id, name, target_muscles, body_parts, equipments, instructions")
    .is("form_rules", null)
    .limit(5000);

  if (error) {
    console.error("Error fetching exercises:", error);
    process.exit(1);
  }

  if (!exercises || exercises.length === 0) {
    console.log("All exercises already have form rules. Nothing to do.");
    process.exit(0);
  }

  console.log(`Found ${exercises.length} exercises to process.`);
  console.log("Processing in parallel batches of 3...\n");

  const CONCURRENCY = 3;
  const BATCH_DELAY = 500; // ms between batches
  let completed = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let batchStart = 0; batchStart < exercises.length; batchStart += CONCURRENCY) {
    const batch = exercises.slice(batchStart, batchStart + CONCURRENCY);
    const results = await Promise.all(
      batch.map((ex, i) => processExercise(ex, supabase, batchStart + i, exercises.length)),
    );

    for (const result of results) {
      completed++;
      if (result === "success") success++;
      else if (result === "failed") failed++;
      else skipped++;
    }

    console.log(`\n⏳ Progress: ${completed}/${exercises.length} (${Math.round((completed / exercises.length) * 100)}%)`);

    if (batchStart + CONCURRENCY < exercises.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("Summary:");
  console.log(`  ✓ Success: ${success}`);
  console.log(`  ⊘ Skipped (no applicable rules): ${skipped}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  Total: ${exercises.length}`);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
