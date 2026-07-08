import Link from "next/link";
import type { Group } from "@mellow/shared";
import { Card } from "./ui";

export function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="p-5 transition hover:border-prayer/50">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{group.name}</h3>
          {group.viewerRole && (
            <span className="rounded-full bg-prayer-soft/60 px-2.5 py-1 text-xs font-semibold text-prayer">
              {group.viewerRole === "OWNER" ? "Owner" : "Member"}
            </span>
          )}
        </div>
        {group.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink/90">{group.description}</p>
        )}
        <p className="mt-3 text-xs text-muted">
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"} · led by{" "}
          {group.owner.displayName}
        </p>
      </Card>
    </Link>
  );
}
