import Link from "next/link";
import { getMe, getMyTalent, getTalent } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { MessageButton } from "@/components/MessageButton";
import { FollowButton } from "@/components/FollowButton";
import { TalentEditor } from "@/components/TalentEditor";

export default async function TalentPage() {
  const me = await getMe();
  const [{ items: talent }, mine] = await Promise.all([
    getTalent(),
    me ? getMyTalent() : Promise.resolve(null),
  ]);

  return (
    <AppShell me={me} pillar="calling" section="talent">
      {me && <TalentEditor initial={mine} />}

      {talent.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">The directory is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Believers open to serve — vocationally or as volunteers — list themselves here. Join it
            with the button above.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {talent.map((t) => (
            <Card key={t.user.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.user.displayName} src={t.user.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {t.user.handle ? (
                      <Link href={`/${t.user.handle}`} className="font-semibold hover:underline">
                        {t.user.displayName}
                      </Link>
                    ) : (
                      <span className="font-semibold">{t.user.displayName}</span>
                    )}
                    <span
                      className="shrink-0 rounded-full bg-prayer-soft px-2 py-0.5 text-xs font-semibold text-prayer"
                      title="Reputation points — off-chain, no monetary value"
                    >
                      ⭐ {t.reputationScore}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted">{t.headline}</p>
                </div>
              </div>
              {!t.isViewer && me && t.user.handle && (
                <div className="mt-3 flex gap-2">
                  <FollowButton handle={t.user.handle} initialFollowing={t.isFollowedByViewer} />
                  <MessageButton handle={t.user.handle} />
                </div>
              )}
              {t.about && <p className="mt-3 line-clamp-3 text-sm text-ink/90">{t.about}</p>}
              {t.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.skills.map((s) => (
                    <span key={s} className="rounded-full bg-calling-soft px-2.5 py-0.5 text-xs font-medium text-calling capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {t.availability && (
                <p className="mt-3 text-xs text-muted">Availability: {t.availability}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
