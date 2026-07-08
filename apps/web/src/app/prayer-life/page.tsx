import { redirect } from "next/navigation";
import { getChallenges, getMe, getStreak } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PrayerSubnav } from "@/components/PrayerSubnav";
import { MarkPrayerDayButton } from "@/components/MarkPrayerDayButton";
import { StreakCalendar } from "@/components/StreakCalendar";
import { CreateChallengeForm } from "@/components/CreateChallengeForm";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Card } from "@/components/ui";
import { localToday } from "@/lib/format";

export default async function PrayerLifePage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const [streak, { items: challenges }] = await Promise.all([getStreak(), getChallenges()]);
  const today = localToday(me.timezone);
  const streakData = streak ?? { current: 0, longest: 0, todayMarked: false, markedDates: [] };

  return (
    <AppShell me={me} pillar="prayer">
      <PrayerSubnav active="life" />

      <Card className="p-6">
        <h1 className="text-lg font-semibold">Your Prayer Life</h1>
        <p className="mt-1 text-sm text-muted">
          Mark each day you pray. Streaks are computed in your timezone ({me.timezone}).
        </p>
        <div className="mt-5">
          <MarkPrayerDayButton initialStreak={streakData} />
        </div>
        <div className="mt-6">
          <StreakCalendar markedDates={streakData.markedDates} today={today} />
        </div>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted">Challenges</h2>
        <CreateChallengeForm />
        {challenges.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            No challenges yet. Create one to pray toward a shared goal.
          </Card>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
