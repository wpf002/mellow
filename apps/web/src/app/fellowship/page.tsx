import { redirect } from "next/navigation";
import { getFeed, getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PostComposer } from "@/components/PostComposer";
import { PostCard } from "@/components/PostCard";
import { Card } from "@/components/ui";

export default async function FellowshipPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  const { items: posts } = await getFeed();

  return (
    <AppShell me={me} pillar="fellowship" section="feed">
      <PostComposer />

      {posts.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">Your feed is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Follow people and share your first post. Posts from those you follow rise to the top.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} canReact />
          ))}
        </div>
      )}
    </AppShell>
  );
}
