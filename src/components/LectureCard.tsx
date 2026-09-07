"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lecture } from "@/lib/types";

const STATUS_LABEL: Record<Lecture["status"], string> = {
  uploaded: "Queued",
  transcribing: "Transcribing…",
  transcribed: "Transcribed",
  generating: "Generating…",
  ready: "Ready",
  error: "Failed",
};

const STATUS_STYLE: Record<Lecture["status"], string> = {
  uploaded: "bg-background text-muted border border-card-border",
  transcribing: "bg-brand-yellow/25 text-amber-800 dark:text-amber-300",
  transcribed: "bg-brand-yellow/25 text-amber-800 dark:text-amber-300",
  generating: "bg-brand-yellow/25 text-amber-800 dark:text-amber-300",
  ready: "bg-brand-blue/15 text-brand-blue-dark",
  error: "bg-brand-pink/15 text-brand-pink-dark",
};

export default function LectureCard({ lecture }: { lecture: Lecture }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${lecture.title}"? This can't be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/lectures/${lecture.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete lecture");
    }
  }

  return (
    <Link
      href={`/lectures/${lecture.id}`}
      className="group flex items-center justify-between rounded-2xl bg-card border border-card-border px-5 py-4 shadow-[0_1px_4px_rgba(22,22,22,0.04)] transition-all hover:shadow-[0_4px_14px_rgba(22,22,22,0.08)] hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{lecture.title}</span>
        <span className="text-xs text-muted">
          {new Date(lecture.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[lecture.status]}`}
        >
          {STATUS_LABEL[lecture.status]}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-muted opacity-0 group-hover:opacity-100 hover:text-brand-pink-dark transition-all disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Link>
  );
}
