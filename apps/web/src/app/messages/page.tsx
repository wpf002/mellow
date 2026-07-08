import Link from "next/link";
import { redirect } from "next/navigation";
import { conversationLabel } from "@mellow/shared";
import { getConversations, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button, Card, cn } from "@/components/ui";

export default async function MessagesPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const { items: conversations } = await getConversations();

  return (
    <AppShell me={me} pillar="fellowship" section="messages">
      <div className="mb-4 flex justify-end">
        <Link href="/messages/new">
          <Button className="bg-fellowship hover:brightness-95">New Group</Button>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No messages yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Open a friend’s profile and tap <span className="font-medium">Message</span> to start a
            conversation, or create a <span className="font-medium">New Group</span> above.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const name = conversationLabel(c);
            const unread = c.unreadCount > 0;
            return (
              <Link key={c.id} href={`/messages/${c.id}`}>
                <Card className={cn("flex items-center gap-3 p-4 transition hover:border-fellowship/50", unread && "border-fellowship/40")}>
                  <Avatar name={name} src={c.isGroup ? null : c.otherMember?.avatarUrl} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate", unread ? "font-bold" : "font-semibold")}>
                        {name}
                      </span>
                      {unread && (
                        <span className="shrink-0 rounded-full bg-fellowship px-2 py-0.5 text-xs font-semibold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={cn("truncate text-sm", unread ? "text-ink" : "text-muted")}>
                      {c.lastMessage
                        ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.body}`
                        : "No messages yet"}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
