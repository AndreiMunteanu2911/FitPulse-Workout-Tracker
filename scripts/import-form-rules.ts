#!/usr/bin/env node

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { readFile } from "fs/promises";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local") });

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INPUT = process.argv[2] ? resolve(ROOT, process.argv[2]) : resolve(ROOT, "generated", "form-rules", "exercise_form_rules.csv");

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// 1. Define the shape of your CSV data
interface CSVRow {
  exercise_id: string;
  form_rules: string;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  const content = await readFile(INPUT, "utf8");
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");

  // Remove header row
  const dataLines = lines.slice(1);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let successCount = 0;
  let errorCount = 0;

  console.log(`Processing ${dataLines.length} rows...`);

  for (const line of dataLines) {
    // 1. Find the first comma to separate ID from JSON
    const firstCommaIndex = line.indexOf(',');
    if (firstCommaIndex === -1) continue;

    const exercise_id = line.substring(0, firstCommaIndex).trim();
    let rawRules = line.substring(firstCommaIndex + 1).trim();

    // 2. Clean up surrounding quotes and escaped double-quotes
    // Remove leading/trailing " if they exist
    if (rawRules.startsWith('"') && rawRules.endsWith('"')) {
      rawRules = rawRules.substring(1, rawRules.length - 1);
    }
    // Convert "" back to "
    const jsonString = rawRules.replace(/""/g, '"');

    try {
      const parsedRules = JSON.parse(jsonString);

      const { error } = await supabase
          .from("exercises")
          .update({ form_rules: parsedRules })
          .eq("exercise_id", exercise_id);

      if (error) {
        console.error(`Failed ID ${exercise_id}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (parseError: any) {
      console.error(`JSON Error for ID ${exercise_id}:`, parseError.message);
      errorCount++;
    }
  }

  console.log(`---`);
  console.log(`Import Complete!`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed:               ${errorCount}`);
  console.log(`Total processed:      ${dataLines.length}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});