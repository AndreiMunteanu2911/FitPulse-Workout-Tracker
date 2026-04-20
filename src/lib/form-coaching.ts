import { callOpenRouter } from "@/lib/ai";
import { formCoachingResultSchema } from "@/lib/validations";
import type { ExerciseFormRules, FormCoachingResult } from "@/types";
import type { FormCoachingRequestInput } from "@/lib/validations";

function stripLargePayload(analysis: FormCoachingRequestInput["analysis"]) {
  return {
    score: analysis.score,
    realtime_score: analysis.realtime_score,
    postset_score: analysis.postset_score,
    reps: analysis.reps,
    rules_confidence: analysis.rules_confidence,
    feedback_summary: analysis.feedback_summary,
    feedback_json: {
      topIssues: analysis.feedback_json.topIssues.slice(0, 5),
      postset: analysis.feedback_json.postset.slice(0, 5),
    },
    rep_metrics_json: analysis.rep_metrics_json.slice(0, 8),
    worst_segment_json: analysis.worst_segment_json
      ? {
          ...analysis.worst_segment_json,
          samples: analysis.worst_segment_json.samples.slice(0, 24),
        }
      : null,
  };
}

export async function generateFormCoaching(params: {
  exerciseName: string;
  formRules: ExerciseFormRules | null;
  analysis: FormCoachingRequestInput["analysis"];
}): Promise<FormCoachingResult> {
  const prompt = [
    "You are a biomechanics-focused form coach.",
    "Analyze the structured exercise session data and return JSON only.",
    "Return exactly this shape: {\"summary\": string, \"top_cues\": string[], \"rep_observations\": string[], \"confidence\": number, \"needs_human_rule_review\": boolean}.",
    "Keep summary under 400 characters.",
    "top_cues should be 2-4 concise, prioritized fixes.",
    "rep_observations should be 2-4 short observations grounded in the provided rep metrics and worst segment only.",
    "Do not give generic fitness advice. Every cue must be justified by the metrics or detected issues.",
    "Write for a normal gym user, not an engineer.",
    "Do not mention internal telemetry or implementation terms such as landmarks, keypoints, coordinates, visibility, angles arrays, thresholds, phase logic, rule ids, or model confidence in the user-facing text.",
    "Translate technical signals into plain coaching language about body position and movement, such as elbows, hips, knees, torso, bar path, control, depth, lockout, and tempo.",
    "Do not say that the app measured landmarks or detected thresholds. State the coaching point directly in natural language.",
    "Be slightly more detailed than a one-line coaching note, but stay compact and practical.",
    "Set needs_human_rule_review=true if the rules confidence is low or the signals conflict.",
    "",
    JSON.stringify({
      exerciseName: params.exerciseName,
      formRules: params.formRules,
      analysis: stripLargePayload(params.analysis),
    }),
  ].join("\n");

  const response = await callOpenRouter([
    {
      role: "system",
      content: "You are a strict JSON generator for exercise form coaching. Return JSON only.",
    },
    {
      role: "user",
      content: prompt,
    },
  ], {
    temperature: 0.2,
    maxTokens: 900,
  });

  const normalized = response
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = formCoachingResultSchema.parse(JSON.parse(normalized));
  return parsed;
}
