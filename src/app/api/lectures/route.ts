import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin, SOURCE_BUCKET } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/session";
import type { SourceType } from "@/lib/types";

function detectSourceType(file: File): SourceType | null {
  if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("lectures")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lectures: data });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing audio or PDF file" }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const sourceType = detectSourceType(file);
  if (!sourceType) {
    return NextResponse.json(
      { error: "Unsupported file type — upload an audio file or a PDF." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const extension = file.name?.split(".").pop() || (sourceType === "pdf" ? "pdf" : "webm");
  const path = `${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(SOURCE_BUCKET)
    .upload(path, file, {
      contentType: file.type || (sourceType === "pdf" ? "application/pdf" : "audio/webm"),
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("lectures")
    .insert({
      user_id: user.id,
      title: title.trim(),
      source_path: path,
      source_type: sourceType,
      status: "uploaded",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lecture: data }, { status: 201 });
}
