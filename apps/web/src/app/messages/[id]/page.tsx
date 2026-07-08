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

  const name = data.otherMember?.displayName ?? "Conversation";

  return (
    <AppShell me={me} pillar="fellowship">
      <div className="mx-auto max-w-2xl">
        <Link href="/messages" className="text-sm text-muted hover:underline">
          ← All Messages
        </Link>

        <Card className="mt-2 flex items-center gap-3 p-4">
          <Avatar name={name} src={data.otherMember?.avatarUrl} size={40} />
          <div>
            <p className="font-semibold">{name}</p>
            {data.otherMember?.handle && (
              <Link
                href={`/${data.otherMember.handle}`}
                className="text-xs text-muted hover:underline"
              >
                @{data.otherMember.handle}
              </Link>
            )}
          </div>
        </Card>

        <Card className="mt-3 px-4">
          <MessageThread conversationId={id} initialMessages={data.items} />
        </Card>
      </div>
    </AppShell>
  );
}
