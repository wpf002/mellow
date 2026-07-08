import { cn } from "./ui";
import { recentDays } from "@/lib/format";

/** A 5-week heatmap of prayer days ending today (in the user's timezone). */
export function StreakCalendar({
  markedDates,
  today,
}: {
  markedDates: string[];
  today: string;
}) {
  const marked = new Set(markedDates);
  const days = recentDays(today, 35);

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1.5">
        {days.map((ymd) => {
          const isMarked = marked.has(ymd);
          const isToday = ymd === today;
          return (
            <span
              key={ymd}
              title={ymd}
              className={cn(
                "h-5 w-5 rounded-[5px] border",
                isMarked ? "border-prayer bg-prayer" : "border-line bg-black/[0.03]",
                isToday && "ring-2 ring-prayer/40",
              )}
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Last 5 weeks · filled = prayed</p>
    </div>
  );
}
