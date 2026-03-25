import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { resolveExercises } from "@/helper/resolveExercises";

interface TemplateExercise {
  exercise_id: string;
  order_index: number;
}

interface Template {
  template_exercises?: TemplateExercise[];
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("templateId");

  if (templateId) {
    // Get single template with exercises
    const { data, error } = await supabase
      .from("workout_templates")
      .select("*, template_exercises (*)")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const exerciseIds = (data?.template_exercises ?? []).map((te: TemplateExercise) => te.exercise_id);
    const exerciseMap = await resolveExercises(supabase, exerciseIds);

    const enriched = {
      ...data,
      template_exercises: (data?.template_exercises ?? [])
        .sort((a: TemplateExercise, b: TemplateExercise) => a.order_index - b.order_index)
        .map((te: TemplateExercise) => ({
          ...te,
          exercise: exerciseMap.get(te.exercise_id) ?? {
            exercise_id: te.exercise_id,
            name: te.exercise_id,
            is_custom: false,
          },
        })),
    };

    return NextResponse.json({ template: enriched });
  }

  // Get all templates
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*, template_exercises (*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allExerciseIds = [
    ...new Set(
      (data || []).flatMap((t: Template) =>
        (t.template_exercises || []).map((te) => te.exercise_id)
      )
    ),
  ];
  const exerciseMap = await resolveExercises(supabase, allExerciseIds);

  const templates = (data || []).map((t: Template) => ({
    ...t,
    template_exercises: (t.template_exercises || [])
      .sort((a: TemplateExercise, b: TemplateExercise) => a.order_index - b.order_index)
      .map((te: TemplateExercise) => ({
        ...te,
        exercise: exerciseMap.get(te.exercise_id) ?? {
          exercise_id: te.exercise_id,
          name: te.exercise_id,
          is_custom: false,
        },
      })),
  }));

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, exercises } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: user.id, name, description })
    .select()
    .single();

  if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 });

  if (exercises && exercises.length > 0) {
    const templateExercises = exercises.map((ex: { exercise_id: string }, index: number) => ({
      template_id: template.id,
      exercise_id: ex.exercise_id,
      order_index: index,
    }));
    const { error: exercisesError } = await supabase.from("template_exercises").insert(templateExercises);
    if (exercisesError) {
      // Rollback: delete the template if exercises fail
      await supabase.from("workout_templates").delete().eq("id", template.id);
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ template });
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, description, exercises } = await req.json();

  if (!id) return NextResponse.json({ error: "Template ID is required" }, { status: 400 });

  // Update template
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 });

  // Update exercises if provided
  if (exercises) {
    // Delete existing exercises
    await supabase.from("template_exercises").delete().eq("template_id", id);

    // Insert new exercises
    if (exercises.length > 0) {
      const templateExercises = exercises.map((ex: { exercise_id: string }, index: number) => ({
        template_id: id,
        exercise_id: ex.exercise_id,
        order_index: index,
      }));
      const { error: exercisesError } = await supabase.from("template_exercises").insert(templateExercises);
      if (exercisesError) return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ template });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Template ID is required" }, { status: 400 });

  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
