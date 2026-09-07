export type LectureStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "generating"
  | "ready"
  | "error";

export type SourceType = "audio" | "pdf";

export interface Lecture {
  id: string;
  user_id: string;
  title: string;
  source_path: string | null;
  source_type: SourceType;
  transcript: string | null;
  status: LectureStatus;
  error_message: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface Note {
  id: string;
  lecture_id: string;
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  note_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  note_id: string;
  question: string;
  choices: string[];
  correct_answer: string;
  created_at: string;
}

export interface LectureDetail extends Lecture {
  note: Note | null;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface GeneratedContent {
  notesMarkdown: string;
  flashcards: { question: string; answer: string }[];
  quiz: { question: string; choices: string[]; correctAnswer: string }[];
}
