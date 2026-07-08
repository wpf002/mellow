import { notFound } from "next/navigation";
import { getCourse, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CourseView } from "@/components/CourseView";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, course] = await Promise.all([getMe(), getCourse(id)]);
  if (!course) notFound();

  return (
    <AppShell me={me} pillar="equipping" section="courses">
      <CourseView initial={course} signedIn={Boolean(me)} />
    </AppShell>
  );
}
