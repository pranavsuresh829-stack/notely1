"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AudioRecorder from "./AudioRecorder";

type Mode = "record" | "upload";
type Stage = "idle" | "uploading" | "transcribing" | "generating" | "error";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading…",
  transcribing: "Processing lecture… this can take a few minutes for longer files",
  generating: "Generating notes, flashcards, and quiz…",
  error: "Something went wrong",
};

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export default function NewLectureForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("record");
  const [title, setTitle] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audio = mode === "record" ? recordedBlob : uploadedFile;
  const busy = stage !== "idle" && stage !== "error";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio || !title.trim()) return;

    setErrorMessage(null);
    setStage("uploading");

    try {
      const formData = new FormData();
      formData.append("file", audio, audio instanceof File ? audio.name : "recording.webm");
      formData.append("title", title.trim());

      const uploadRes = await fetch("/api/lectures", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error(await parseError(uploadRes, "Upload failed"));
      const { lecture } = await uploadRes.json();

      setStage("transcribing");
      const processRes = await fetch(`/api/lectures/${lecture.id}/process`, {
        method: "POST",
      });
      if (!processRes.ok) {
        throw new Error(await parseError(processRes, "Processing failed"));
      }

      setStage("generating");
      const generateRes = await fetch(`/api/lectures/${lecture.id}/generate`, {
        method: "POST",
      });
      if (!generateRes.ok) {
        throw new Error(await parseError(generateRes, "Note generation failed"));
      }

      router.push(`/lectures/${lecture.id}`);
    } catch (err) {
      setStage("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md flex flex-col gap-5 bg-card border border-card-border rounded-3xl p-6 shadow-[0_2px_10px_rgba(22,22,22,0.05)]"
    >
      <input
        type="text"
        placeholder="Lecture title (e.g. Bio 101 — Cell Division)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
        className="w-full rounded-xl border-2 border-card-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-blue disabled:opacity-50"
      />

      <div className="flex rounded-full bg-background border border-card-border p-1 text-sm">
        {(["record", "upload"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            disabled={busy}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 capitalize font-medium transition-all disabled:opacity-50 ${
              mode === m
                ? "bg-brand-blue text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "record" ? (
        <div className="rounded-2xl border-2 border-dashed border-brand-blue/30 bg-brand-blue/5 py-8">
          <AudioRecorder onRecordingComplete={setRecordedBlob} disabled={busy} />
          {recordedBlob && (
            <p className="text-center text-sm font-medium text-brand-blue-dark mt-3">
              Recording captured ✓
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-brand-blue/30 bg-brand-blue/5 py-8 flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,application/pdf,.pdf"
            disabled={busy}
            onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:text-white file:px-4 file:py-2 file:text-sm file:font-medium file:cursor-pointer"
          />
          {uploadedFile ? (
            <p className="text-sm text-muted">{uploadedFile.name}</p>
          ) : (
            <p className="text-xs text-muted">Audio file or PDF</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!audio || !title.trim() || busy}
        className="w-full rounded-full bg-brand-pink text-white py-3.5 text-sm font-semibold shadow-[0_4px_14px_rgba(242,84,125,0.35)] transition-all hover:bg-brand-pink-dark hover:shadow-[0_4px_18px_rgba(242,84,125,0.45)] disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? STAGE_LABEL[stage] : "Generate notes"}
      </button>

      {stage === "error" && errorMessage && (
        <p className="text-sm text-brand-pink-dark font-medium">{errorMessage}</p>
      )}
    </form>
  );
}
