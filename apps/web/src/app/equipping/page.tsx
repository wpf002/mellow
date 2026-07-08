import Link from "next/link";
import { COURSE_CATEGORY_LABEL, courseCategorySchema, type CourseCategory } from "@mellow/shared";
import { getCourses, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { CourseCard } from "@/components/CourseCard";
import { Button, Card, cn } from "@/components/ui";

export default async function EquippingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const parsedCat = courseCategorySchema.safeParse(params.category);
  const category: CourseCategory | undefined = parsedCat.success ? parsedCat.data : undefined;

  const [me, { items: courses }] = await Promise.all([getMe(), getCourses(category)]);

  return (
    <AppShell me={me} pillar="equipping" section="courses">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/equipping"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              !category ? "bg-equipping text-white" : "border border-equipping/50 text-equipping-ink hover:bg-equipping-soft/50",
            )}
          >
            All
          </Link>
          {(Object.keys(COURSE_CATEGORY_LABEL) as CourseCategory[]).map((c) => (
            <Link
              key={c}
              href={`/equipping?category=${c}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                category === c ? "bg-equipping text-white" : "border border-equipping/50 text-equipping-ink hover:bg-equipping-soft/50",
              )}
            >
              {COURSE_CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>
        {me && (
          <Link href="/equipping/new">
            <Button className="bg-equipping hover:brightness-95">Teach a course</Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No courses{category ? " in this category" : ""} yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The Equipping Center is where believers teach and grow — discipleship, Bible study,
            theology, and more. Every course is free.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
