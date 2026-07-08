import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CourseComposer } from "@/components/CourseComposer";

export default async function NewCoursePage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  return (
    <AppShell me={me} pillar="equipping" section="courses">
      <div className="mx-auto max-w-2xl">
        <Link href="/equipping" className="text-sm text-muted hover:underline">
          ← All Courses
        </Link>
        <h1 className="mt-2 mb-4 text-2xl font-bold">Teach a course</h1>
        <CourseComposer />
      </div>
    </AppShell>
  );
}
