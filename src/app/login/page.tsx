"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MascotFull } from "@/components/Mascot";

type Mode = "signin" | "signup";
type Status = "idle" | "loading" | "error" | "checkEmail";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = supabaseBrowser();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setStatus("error");
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        // This Supabase project still has "Confirm email" turned on, so
        // signUp doesn't return a usable session yet — nothing to do but
        // wait for them to click the confirmation link. Turn that setting
        // off (Authentication -> Providers -> Email) for instant sign-up.
        setStatus("checkEmail");
        return;
      }
      window.location.href = "/";
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setStatus("error");
      setError(signInError.message);
      return;
    }
    window.location.href = "/";
  }

  function switchMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setStatus("idle");
    setError(null);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12 gap-6">
      <MascotFull className="h-28 w-auto drop-shadow-[0_10px_16px_rgba(95,199,242,0.35)]" />

      <div className="w-full max-w-sm bg-card border border-card-border rounded-3xl p-6 shadow-[0_2px_10px_rgba(22,22,22,0.05)] flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-bold">
            {mode === "signin" ? "Sign in to Notely" : "Create your account"}
          </h1>
          <p className="text-sm text-muted">
            {mode === "signin"
              ? "Enter your email and password."
              : "Pick a password — that's it, no email step."}
          </p>
        </div>

        {status === "checkEmail" ? (
          <p className="text-sm text-center font-medium text-brand-blue-dark bg-brand-blue/10 rounded-2xl px-4 py-3">
            Check your inbox at <strong>{email}</strong> to confirm your account, then come back and sign in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-xl border-2 border-card-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-blue disabled:opacity-50"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-xl border-2 border-card-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-blue disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || !email || !password}
              className="w-full rounded-full bg-brand-pink text-white py-3 text-sm font-semibold shadow-[0_4px_14px_rgba(242,84,125,0.35)] hover:bg-brand-pink-dark transition-colors disabled:opacity-40"
            >
              {status === "loading"
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
            {status === "error" && error && (
              <p className="text-sm text-brand-pink-dark font-medium text-center">{error}</p>
            )}
          </form>
        )}

        <button
          type="button"
          onClick={switchMode}
          className="text-sm text-muted hover:text-foreground text-center"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
