// ── AI Chat API Route (Streaming) ───────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string, conversationHistory?: { role, content }[] }
// Response: SSE stream with text chunks, ending with a JSON action (if any).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { classifyIntent } from "@/lib/rag-intent";
import { buildFullContext, buildUserStatsContext, buildRecentWorkouts, buildMuscleGapAnalysis } from "@/lib/rag-context";
import { buildContextPrompt, SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { streamOpenRouter, generateEmbedding, type ChatMessage } from "@/lib/ai";
import { generateAndCreateWorkout, parseDraftWorkoutFromLLM, createDraftWorkoutInDB } from "@/lib/workout-generator";
import { buildExerciseIndex, resolveExerciseInput } from "@/lib/exercise-index";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const message: string = body.message;
  const conversationHistory: { role: string; content: string }[] =
    body.conversationHistory ?? [];

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  // 1. Classify intent
  const intent = classifyIntent(message);

  // 2. Generate embedding for the query (for similarity search)
  let queryEmbedding: number[] | undefined;
  try {
    queryEmbedding = await generateEmbedding(message);
  } catch {
    // Embedding failure is non-fatal — proceed without it
    queryEmbedding = undefined;
  }

  // 3. Build exercise index (needed for context + workout creation)
  const exerciseIndexArray = await buildExerciseIndex(supabase, user.id);

  // 4. Build RAG context (includes exercise index text from buildFullContext)
  const context = await buildFullContext(supabase, user.id, intent, queryEmbedding);

  // 5. If workout request, create it BEFORE the LLM call
  let workoutAction: { type: string; workoutId: string; name: string; exercises: { name: string; sets: { reps: number; weight: number }[] }[] } | null = null;
  if (intent.needsWorkoutCreation) {
    try {
      const result = await generateAndCreateWorkout(
        supabase,
        user.id,
        message,
        context.muscleGaps,
        context.recentWorkouts,
        exerciseIndexArray,
      );

      // Resolve exercise names for the action (for display in UI)
      const exercisesWithNames = result.exercises.map((ex) => {
        const entry = exerciseIndexArray.find((e) => e.id === ex.exercise_id);
        return {
          name: entry?.name ?? ex.exercise_id,
          sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
        };
      });

      workoutAction = {
        type: "workout_created",
        workoutId: result.workoutId,
        name: result.name,
        exercises: exercisesWithNames,
      };
    } catch (err) {
      // If workout creation fails, still proceed with the chat
      console.error("Workout creation failed:", err);
    }
  }

  // 6. Build messages for the LLM
  const systemContext = buildContextPrompt(context, intent);
  const systemMessage: ChatMessage = {
    role: "system",
    content: `${SYSTEM_PROMPT}\n\n${systemContext}`,
  };

  // If workout was created, append instructions for the LLM
  if (workoutAction) {
    const exercisesSummary = workoutAction.exercises
      .map((ex) => `- ${ex.name}: ${ex.sets.map((s) => `${s.reps} reps × ${s.weight}kg`).join(", ")}`)
      .join("\n");

    const actionJSON = JSON.stringify({
      action: "workout_created",
      workoutId: workoutAction.workoutId,
      name: workoutAction.name,
      exercises: workoutAction.exercises,
    });

    systemMessage.content += `\n\nWORKOUT CREATED: A draft workout "${workoutAction.name}" has been created in the database. Mention the workout name and the plan below to the user. Tell them they can review and start it. At the END of your response, output this exact JSON on a new line:\n${actionJSON}\n\nExercise plan:\n${exercisesSummary}`;
  }

  const messages: ChatMessage[] = [
    systemMessage,
    ...conversationHistory
      .filter(
        (m) => m.role === "user" || m.role === "assistant",
      )
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  // 7. Stream the response
  const stream = streamOpenRouter(messages, {
    temperature: 0.7,
    maxTokens: 1024,
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
