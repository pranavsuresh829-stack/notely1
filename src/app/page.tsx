import Link from "next/link";
import NewLectureForm from "@/components/NewLectureForm";
import { MascotFull } from "@/components/Mascot";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center px-6 py-10 gap-7">
      <div className="text-center flex flex-col items-center gap-3">
        <MascotFull className="h-36 w-auto drop-shadow-[0_10px_16px_rgba(95,199,242,0.35)]" />
        <h1 className="text-3xl font-bold tracking-tight">Notely</h1>
        <p className="text-muted text-sm max-w-xs leading-relaxed">
          Record or upload a lecture. Get back structured notes, flashcards, and a quiz.
        </p>
      </div>

      <NewLectureForm />

      <Link
        href="/lectures"
        className="text-sm font-medium text-brand-blue-dark hover:text-brand-pink-dark transition-colors"
      >
        View saved lectures →
      </Link>
    </div>
  );
}
