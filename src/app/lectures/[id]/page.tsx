import { notFound, redirect } from "next/navigation";
import { getLectureDetail } from "@/lib/lectures";
import { getAuthUser } from "@/lib/supabase/session";
import LectureDetailView from "@/components/LectureDetailView";

export const dynamic = "force-dynamic";

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const lecture = await getLectureDetail(id, user.id);

  if (!lecture) notFound();

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-10">
      <LectureDetailView initial={lecture} />
    </div>
  );
}
