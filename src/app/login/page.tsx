"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MascotFull } from "@/components/Mascot";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = supabaseBrowser();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (sendError) {
      setStatus("error");
      setError(sendError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12 gap-6">
      <MascotFull className="h-28 w-auto drop-shadow-[0_10px_16px_rgba(95,199,242,0.35)]" />

      <div className="w-full max-w-sm bg-card border border-card-border rounded-3xl p-6 shadow-[0_2px_10px_rgba(22,22,22,0.05)] flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-bold">Sign in to Notely</h1>
          <p className="text-sm text-muted">
            No password — we'll email you a link to sign in.
          </p>
        </div>

        {status === "sent" ? (
          <p className="text-sm text-center font-medium text-brand-blue-dark bg-brand-blue/10 rounded-2xl px-4 py-3">
            Check your inbox at <strong>{email}</strong> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
              className="w-full rounded-xl border-2 border-card-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-blue disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="w-full rounded-full bg-brand-pink text-white py-3 text-sm font-semibold shadow-[0_4px_14px_rgba(242,84,125,0.35)] hover:bg-brand-pink-dark transition-colors disabled:opacity-40"
            >
              {status === "sending" ? "Sending link…" : "Send magic link"}
            </button>
            {status === "error" && error && (
              <p className="text-sm text-brand-pink-dark font-medium text-center">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
