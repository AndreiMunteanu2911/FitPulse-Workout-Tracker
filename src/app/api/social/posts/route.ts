import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let content: string | null = null;
  let workout_id: string | null = null;
  let image_url: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    content = (formData.get("content") as string) || null;
    workout_id = (formData.get("workout_id") as string) || null;
    const imageFile = formData.get("image") as File | null;

    if (imageFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(`${user.id}/${Date.now()}-${imageFile.name}`, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(uploadData.path);

      image_url = urlData.publicUrl;
    }
  } else {
    const body = await req.json();
    content = body.content ?? null;
    workout_id = body.workout_id ?? null;
  }

  if (!content && !image_url && !workout_id) {
    return NextResponse.json({ error: "Post must have content, image, or workout" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, content, image_url, workout_id })
    .select("*, user_stats(display_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: { ...data, likes_count: 0, comments_count: 0, liked_by_me: false } });
}
