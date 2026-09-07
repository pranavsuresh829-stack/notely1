import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/session";
import type { Lecture } from "@/lib/types";
import LectureCard from "@/components/LectureCard";

export const dynamic = "force-dynamic";

export default async function LecturesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = supabaseAdmin();
  const { data: lectures, error } = await supabase
    .from("lectures")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Lecture[]>();

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Lectures</h1>
        <Link
          href="/"
          className="text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors px-4 py-2 rounded-full shadow-sm"
        >
          + New lecture
        </Link>
      </div>

      {error && (
        <p className="text-sm text-brand-pink-dark font-medium">
          Failed to load lectures: {error.message}
        </p>
      )}

      {!error && lectures?.length === 0 && (
        <p className="text-sm text-muted">
          No lectures yet.{" "}
          <Link href="/" className="text-brand-blue-dark font-medium underline underline-offset-2">
            Record or upload one
          </Link>{" "}
          to get started.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {lectures?.map((lecture) => (
          <LectureCard key={lecture.id} lecture={lecture} />
        ))}
      </div>
    </div>
  );
}
