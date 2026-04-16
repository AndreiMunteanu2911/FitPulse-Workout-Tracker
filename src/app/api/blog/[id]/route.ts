import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, requireAdmin } from "@/helper/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { id } = await params;

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const content = formData.get("content") as string | null;
    const image = formData.get("image") as File | null;
    let image_url = formData.get("image_url") as string | null;

    const updates: any = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    
    if (image && image.size > 0) {
      const fileName = `${Date.now()}-${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, image);
      
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
      
      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(uploadData.path);
      
      updates.image_url = urlData.publicUrl;
    } else if (image_url !== null) {
      updates.image_url = image_url;
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { id } = await params;

  // Optional: delete image from storage
  const { data: post } = await supabase
    .from("blog_posts")
    .select("image_url")
    .eq("id", id)
    .single();

  if (post?.image_url) {
    const urlParts = post.image_url.split("/storage/v1/object/public/blog-images/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("blog-images").remove([filePath]);
    }
  }

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
