"use client";

import { useEffect, useState } from "react";
import type { LectureDetail } from "@/lib/types";
import { MascotFull } from "./Mascot";
import NotesView from "./NotesView";
import FlashcardsView from "./FlashcardsView";
import QuizView from "./QuizView";

type Tab = "notes" | "flashcards" | "quiz";

function processingLabel(status: string, sourceType: string): string {
  const verb = sourceType === "pdf" ? "Reading PDF" : "Transcribing audio";
  const labels: Record<string, string> = {
    uploaded: sourceType === "pdf" ? "Queued to read PDF…" : "Queued for transcription…",
    transcribing: `${verb}…`,
    transcribed: "Generating notes…",
    generating: "Generating notes, flashcards, and quiz…",
  };
  return labels[status] ?? "Processing…";
}

export default function LectureDetailView({ initial }: { initial: LectureDetail }) {
  const [lecture, setLecture] = useState(initial);
  const [tab, setTab] = useState<Tab>("notes");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    if (lecture.status === "ready" || lecture.status === "error") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/lectures/${lecture.id}`);
      if (res.ok) {
        const { lecture: updated } = await res.json();
        setLecture(updated);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [lecture.id, lecture.status]);

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);

    try {
      // Resume from whichever step actually failed — no transcript yet means
      // transcription/PDF-reading never finished, otherwise it was generation.
      if (!lecture.transcript) {
        const res = await fetch(`/api/lectures/${lecture.id}/process`, { method: "POST" });
        if (!res.ok) throw new Error((await res.json()).error || "Processing failed again");
      }

      const res = await fetch(`/api/lectures/${lecture.id}/generate`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Note generation failed again");

      const detailRes = await fetch(`/api/lectures/${lecture.id}`);
      if (detailRes.ok) {
        const { lecture: updated } = await detailRes.json();
        setLecture(updated);
      }
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  if (lecture.status === "error") {
    return (
      <div className="flex flex-col gap-3 items-center text-center py-10 bg-card border border-card-border rounded-3xl p-8">
        <h1 className="text-xl font-bold">{lecture.title}</h1>
        <p className="text-sm text-brand-pink-dark font-medium">
          Processing failed: {lecture.error_message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-1 rounded-full bg-brand-blue text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:bg-brand-blue-dark transition-colors disabled:opacity-50"
        >
          {retrying ? "Retrying…" : "Retry"}
        </button>
        {retryError && (
          <p className="text-sm text-brand-pink-dark font-medium">{retryError}</p>
        )}
      </div>
    );
  }

  if (lecture.status !== "ready") {
    return (
      <div className="flex flex-col items-center gap-4 py-14 text-center">
        <MascotFull className="h-32 w-auto animate-bounce [animation-duration:2s]" />
        <h1 className="text-xl font-bold">{lecture.title}</h1>
        <p className="text-sm text-muted font-medium">
          {processingLabel(lecture.status, lecture.source_type)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{lecture.title}</h1>

      <div className="flex rounded-full bg-card border border-card-border p-1 text-sm shadow-[0_1px_4px_rgba(22,22,22,0.04)]">
        {(["notes", "flashcards", "quiz"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 capitalize font-medium transition-all ${
              tab === t ? "bg-brand-blue text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-3xl p-6 shadow-[0_2px_10px_rgba(22,22,22,0.05)]">
        {tab === "notes" && lecture.note && <NotesView content={lecture.note.content} />}
        {tab === "flashcards" && <FlashcardsView flashcards={lecture.flashcards} />}
        {tab === "quiz" && <QuizView quiz={lecture.quiz} />}
      </div>
    </div>
  );
}
