import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateLectureMaterials } from "@/lib/generation";
import { getAuthUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  if (!lecture.transcript) {
    return NextResponse.json({ error: "Lecture has no transcript yet" }, { status: 400 });
  }

  await supabase.from("lectures").update({ status: "generating" }).eq("id", id);

  try {
    const generated = await generateLectureMaterials(lecture.transcript);

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .insert({ lecture_id: id, content: generated.notesMarkdown })
      .select()
      .single();
    if (noteError || !note) throw new Error(noteError?.message || "Failed to save notes");

    if (generated.flashcards.length > 0) {
      const { error: flashcardsError } = await supabase.from("flashcards").insert(
        generated.flashcards.map((f) => ({
          note_id: note.id,
          question: f.question,
          answer: f.answer,
        }))
      );
      if (flashcardsError) throw new Error(flashcardsError.message);
    }

    if (generated.quiz.length > 0) {
      const { error: quizError } = await supabase.from("quiz_questions").insert(
        generated.quiz.map((q) => ({
          note_id: note.id,
          question: q.question,
          choices: q.choices,
          correct_answer: q.correctAnswer,
        }))
      );
      if (quizError) throw new Error(quizError.message);
    }

    const { data: updatedLecture, error: statusError } = await supabase
      .from("lectures")
      .update({ status: "ready", error_message: null })
      .eq("id", id)
      .select()
      .single();
    if (statusError) throw new Error(statusError.message);

    return NextResponse.json({ lecture: updatedLecture });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await supabase
      .from("lectures")
      .update({ status: "error", error_message: message })
      .eq("id", id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
