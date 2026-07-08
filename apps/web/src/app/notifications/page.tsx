import Link from "next/link";
import { redirect } from "next/navigation";
import { NOTIFICATION_VERB, notificationHref } from "@mellow/shared";
import { getMe, getNotifications } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card, cn } from "@/components/ui";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { formatDate } from "@/lib/format";

export default async function NotificationsPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const { items } = await getNotifications();

  return (
    <AppShell me={me} pillar="prayer">
      <MarkNotificationsRead />
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-xl font-bold">Notifications</h1>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="text-lg font-semibold">You're all caught up</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Prayers, follows, reactions, and comments on your activity show up here.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const href = notificationHref(n.type, n.entityId, n.actor.handle);
              const name = n.actor.displayName;
              const inner = (
                <Card
                  className={cn(
                    "flex items-center gap-3 p-4 transition hover:border-prayer/50",
                    !n.read && "border-prayer/40 bg-prayer-soft/20",
                  )}
                >
                  <Avatar name={name} src={n.actor.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{name}</span>{" "}
                      <span className="text-ink/80">{NOTIFICATION_VERB[n.type]}</span>
                    </p>
                    <p className="text-xs text-muted">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </Card>
              );
              return href ? (
                <Link key={n.id} href={href}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
