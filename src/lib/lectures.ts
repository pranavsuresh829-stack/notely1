import { supabaseAdmin } from "./supabase/server";
import type { LectureDetail } from "./types";

// userId is required and always checked in the same query as the lecture
// fetch (not as a separate ownership check afterward) — a lecture belonging
// to someone else simply doesn't match and comes back as "not found",
// which is what we want: no distinction between "doesn't exist" and "not
// yours" from the outside.
export async function getLectureDetail(
  id: string,
  userId: string
): Promise<LectureDetail | null> {
  const supabase = supabaseAdmin();

  const { data: lecture, error: lectureError } = await supabase
    .from("lectures")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (lectureError || !lecture) return null;

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("lecture_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let flashcards: LectureDetail["flashcards"] = [];
  let quiz: LectureDetail["quiz"] = [];

  if (note) {
    const [flashcardsRes, quizRes] = await Promise.all([
      supabase.from("flashcards").select("*").eq("note_id", note.id),
      supabase.from("quiz_questions").select("*").eq("note_id", note.id),
    ]);
    flashcards = flashcardsRes.data ?? [];
    quiz = quizRes.data ?? [];
  }

  return { ...lecture, note: note ?? null, flashcards, quiz };
}
