// ── AI Messages API ─────────────────────────────────────────────────────────
// POST /api/ai/messages — batch save user + assistant messages to a conversation
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversationId, messages } = body as {
    conversationId: string;
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!conversationId || !messages?.length) {
    return NextResponse.json(
      { error: "conversationId and messages are required" },
      { status: 400 },
    );
  }

  // Verify conversation belongs to user
  const { data: conv, error: convError } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Insert messages
  const rows = messages.map((m) => ({
    conversation_id: conversationId,
    role: m.role,
    content: m.content,
  }));

  const { error: insertError } = await supabase
    .from("ai_messages")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update conversation updated_at
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ success: true });
}
