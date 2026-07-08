import Link from "next/link";
import { notFound } from "next/navigation";
import { getMe, getPost, getPostComments } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { FellowshipSubnav } from "@/components/FellowshipSubnav";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { ReactionBar } from "@/components/ReactionBar";
import { PostCommentComposer } from "@/components/PostCommentComposer";
import { formatDate } from "@/lib/format";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, post] = await Promise.all([getMe(), getPost(id)]);
  if (!post) notFound();

  const { items: comments } = await getPostComments(id);
  const { author } = post;

  return (
    <AppShell me={me} pillar="fellowship">
      <FellowshipSubnav active="feed" />
      <div className="mx-auto max-w-2xl">
        <Link href="/fellowship" className="text-sm text-muted hover:underline">
          ← Back to feed
        </Link>

        <Card className="mt-2 p-6">
          <div className="flex items-center gap-3">
            <Avatar name={author.displayName} src={author.avatarUrl} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {author.handle ? (
                  <Link href={`/${author.handle}`} className="font-semibold hover:underline">
                    {author.displayName}
                  </Link>
                ) : (
                  <span className="font-semibold">{author.displayName}</span>
                )}
                {author.handle && <span className="text-sm text-muted">@{author.handle}</span>}
              </div>
              <span className="text-xs text-muted">{formatDate(post.createdAt)}</span>
            </div>
          </div>

          <p className="mt-4 text-[15px] whitespace-pre-wrap text-ink/90">{post.body}</p>

          <div className="mt-5">
            <ReactionBar postId={post.id} initial={post.reactions} disabled={!me} />
          </div>
        </Card>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted">
            {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
          </h2>

          {me ? (
            <Card className="p-4">
              <PostCommentComposer postId={post.id} />
            </Card>
          ) : (
            <Card className="p-4 text-center text-sm text-muted">
              <Link href="/sign-in" className="text-fellowship hover:underline">
                Sign in
              </Link>{" "}
              to react and comment.
            </Card>
          )}

          <div className="mt-3 space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={comment.author.displayName}
                    src={comment.author.avatarUrl}
                    size={32}
                  />
                  <div className="flex items-center gap-2">
                    {comment.author.handle ? (
                      <Link
                        href={`/${comment.author.handle}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {comment.author.displayName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">{comment.author.displayName}</span>
                    )}
                    <span className="text-xs text-muted">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-ink/90">{comment.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
