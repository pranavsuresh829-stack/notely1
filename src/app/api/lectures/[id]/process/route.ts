import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, SOURCE_BUCKET } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/transcription";
import { extractPdfText } from "@/lib/pdfExtract";
import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const maxDuration = 300; // long lectures/PDFs take a while to process

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: lecture, error: fetchError } = await supabase
    .from("lectures")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }
  if (!lecture.source_path) {
    return NextResponse.json({ error: "Lecture has no source file" }, { status: 400 });
  }

  await supabase.from("lectures").update({ status: "transcribing" }).eq("id", id);

  try {
    const { data: sourceFile, error: downloadError } = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(lecture.source_path);

    if (downloadError || !sourceFile) {
      throw new Error(downloadError?.message || "Failed to download source file");
    }

    const transcript =
      lecture.source_type === "pdf"
        ? await extractPdfText(Buffer.from(await sourceFile.arrayBuffer()))
        : await transcribeAudio(sourceFile, lecture.source_path);

    const { data: updated, error: updateError } = await supabase
      .from("lectures")
      .update({ transcript, status: "transcribed", error_message: null })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ lecture: updated });
  } catch (err) {
    const fallback = lecture.source_type === "pdf" ? "PDF text extraction failed" : "Transcription failed";
    const message = err instanceof Error ? err.message : fallback;
    await supabase
      .from("lectures")
      .update({ status: "error", error_message: message })
      .eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
