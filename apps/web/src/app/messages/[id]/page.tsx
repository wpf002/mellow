import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getConversationMessages, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { MessageThread } from "@/components/MessageThread";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const data = await getConversationMessages(id);
  if (!data) notFound();

  const name = data.isGroup
    ? data.title ?? data.members.map((m) => m.displayName).join(", ")
    : data.otherMember?.displayName ?? "Conversation";

  return (
    <AppShell me={me} pillar="fellowship" section="messages">
      <div className="mx-auto max-w-2xl">
        <Link href="/messages" className="text-sm text-muted hover:underline">
          ← All Messages
        </Link>

        <Card className="mt-2 flex items-center gap-3 p-4">
          <Avatar name={name} src={data.isGroup ? null : data.otherMember?.avatarUrl} size={40} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {data.isGroup ? (
              <p className="truncate text-xs text-muted">
                {data.members.length + 1} members ·{" "}
                {data.members.map((m) => `@${m.handle}`).join(", ")}
              </p>
            ) : (
              data.otherMember?.handle && (
                <Link
                  href={`/${data.otherMember.handle}`}
                  className="text-xs text-muted hover:underline"
                >
                  @{data.otherMember.handle}
                </Link>
              )
            )}
          </div>
        </Card>

        <Card className="mt-3 px-4">
          <MessageThread conversationId={id} initialMessages={data.items} isGroup={data.isGroup} />
        </Card>
      </div>
    </AppShell>
  );
}
