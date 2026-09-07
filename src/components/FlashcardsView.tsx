"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/types";

export default function FlashcardsView({ flashcards }: { flashcards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) {
    return <p className="text-sm text-muted">No flashcards generated.</p>;
  }

  const card = flashcards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + flashcards.length) % flashcards.length);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold text-muted">
        {index + 1} / {flashcards.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`w-full max-w-md min-h-48 rounded-2xl border-2 flex items-center justify-center p-6 text-center text-sm font-medium transition-colors ${
          flipped
            ? "bg-brand-yellow/15 border-brand-yellow/40"
            : "bg-brand-blue/10 border-brand-blue/30"
        }`}
      >
        {flipped ? card.answer : card.question}
      </button>
      <p className="text-xs text-muted">Tap the card to flip</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          className="text-sm font-medium px-4 py-2 rounded-full bg-card border border-card-border hover:border-brand-blue transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="text-sm font-medium px-4 py-2 rounded-full bg-card border border-card-border hover:border-brand-blue transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
