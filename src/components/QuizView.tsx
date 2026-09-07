"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";

export default function QuizView({ quiz }: { quiz: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (quiz.length === 0) {
    return <p className="text-sm text-muted">No quiz generated.</p>;
  }

  const score = quiz.filter((q) => answers[q.id] === q.correct_answer).length;

  return (
    <div className="flex flex-col gap-7">
      {quiz.map((q, i) => {
        const selected = answers[q.id];
        return (
          <div key={q.id} className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold">
              {i + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-2">
              {q.choices.map((choice) => {
                const isSelected = selected === choice;
                const isCorrect = choice === q.correct_answer;
                let style = "border-card-border hover:border-brand-blue/50";
                if (submitted && isSelected && isCorrect) {
                  style = "border-emerald-500 bg-emerald-500/10";
                } else if (submitted && isSelected && !isCorrect) {
                  style = "border-brand-pink bg-brand-pink/10";
                } else if (submitted && isCorrect) {
                  style = "border-emerald-500";
                } else if (isSelected) {
                  style = "border-brand-blue bg-brand-blue/10";
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: choice }))}
                    className={`text-left text-sm font-medium px-4 py-2.5 rounded-xl border-2 transition-colors disabled:cursor-default ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted ? (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
          className="self-start rounded-full bg-brand-pink text-white px-6 py-2.5 text-sm font-semibold shadow-[0_4px_14px_rgba(242,84,125,0.35)] hover:bg-brand-pink-dark transition-colors disabled:opacity-40 disabled:shadow-none"
        >
          Submit quiz
        </button>
      ) : (
        <p className="inline-flex self-start items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-brand-blue/15 text-brand-blue-dark">
          Score: {score} / {quiz.length}
        </p>
      )}
    </div>
  );
}
