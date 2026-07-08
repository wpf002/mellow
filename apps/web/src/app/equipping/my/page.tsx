import { redirect } from "next/navigation";
import Link from "next/link";
import { getMe, getMyCourses } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { Button, Card } from "@/components/ui";

export default async function MyLearningPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const { enrolled, teaching } = await getMyCourses();

  return (
    <AppShell me={me} pillar="equipping" section="learning">
      <section>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted">Enrolled</h2>
        {enrolled.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted">You haven’t enrolled in any courses yet.</p>
            <div className="mt-4">
              <Link href="/equipping">
                <Button className="bg-equipping hover:brightness-95">Browse courses</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {enrolled.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted">Teaching</h2>
          <Link href="/equipping/new" className="text-sm font-semibold text-equipping-ink hover:underline">
            + New course
          </Link>
        </div>
        {teaching.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            You haven’t created any courses. Share what God has taught you.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {teaching.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
