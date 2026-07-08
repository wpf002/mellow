import Link from "next/link";
import type { Post } from "@mellow/shared";
import { Avatar } from "./Avatar";
import { Card } from "./ui";
import { ReactionBar } from "./ReactionBar";
import { formatDate } from "@/lib/format";

const visibilityLabel: Record<string, string> = { FRIENDS: "Friends", PRIVATE: "Private" };

export function PostCard({ post, canReact }: { post: Post; canReact: boolean }) {
  const { author } = post;
  const badge = visibilityLabel[post.visibility];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={author.displayName} src={author.avatarUrl} size={40} />
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
        {badge && (
          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-muted">
            {badge}
          </span>
        )}
      </div>

      <Link href={`/fellowship/${post.id}`} className="mt-3 block">
        <p className="text-[15px] whitespace-pre-wrap text-ink/90">{post.body}</p>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3">
        <ReactionBar postId={post.id} initial={post.reactions} disabled={!canReact} />
        <Link
          href={`/fellowship/${post.id}`}
          className="shrink-0 text-sm text-muted hover:underline"
        >
          💬 {post.commentCount}
        </Link>
      </div>
    </Card>
  );
}
