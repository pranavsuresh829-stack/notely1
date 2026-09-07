import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, SOURCE_BUCKET } from "@/lib/supabase/server";
import { getLectureDetail } from "@/lib/lectures";
import { getAuthUser } from "@/lib/supabase/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const detail = await getLectureDetail(id, user.id);

  if (!detail) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  return NextResponse.json({ lecture: detail });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: lecture } = await supabase
    .from("lectures")
    .select("source_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  if (lecture.source_path) {
    await supabase.storage.from(SOURCE_BUCKET).remove([lecture.source_path]);
  }

  const { error } = await supabase
    .from("lectures")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
