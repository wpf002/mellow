import type { PublicUser } from "@mellow/shared";
import { SiteHeader } from "./SiteHeader";
import { PillarTabs, type Pillar } from "./PillarTabs";

/** Authenticated app frame: header + four-pillar tab bar + page content. */
export function AppShell({
  me,
  pillar,
  children,
}: {
  me: PublicUser | null;
  pillar: Pillar;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <SiteHeader me={me} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PillarTabs active={pillar} />
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
