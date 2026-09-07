"use client";

import { useRef, useState } from "react";

export default function AudioRecorder({
  onRecordingComplete,
  disabled,
}: {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(
        "Couldn't access the microphone. Check your browser's site permissions and try again."
      );
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-16 w-16">
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-brand-pink/40 animate-ping" />
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative h-16 w-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg ${
            isRecording
              ? "bg-brand-pink hover:bg-brand-pink-dark"
              : "bg-brand-blue hover:bg-brand-blue-dark"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <span
            className={`bg-white ${isRecording ? "h-4 w-4 rounded-sm" : "h-5 w-5 rounded-full"}`}
          />
        </button>
      </div>
      <p className="text-sm font-medium text-muted tabular-nums">
        {isRecording ? `Recording… ${mins}:${secs}` : "Tap to record"}
      </p>
      {error && <p className="text-sm text-brand-pink-dark font-medium">{error}</p>}
    </div>
  );
}
