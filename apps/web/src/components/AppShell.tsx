import type { PublicUser } from "@mellow/shared";
import { SiteHeader } from "./SiteHeader";
import { PillarTabs, type Pillar } from "./PillarTabs";
import { LeftNav, RightRail } from "./PillarNav";

/**
 * Authenticated app frame (per the deck): header + four-pillar tab bar, then a
 * 3-column body — left filter nav · center content · right utility rail. Rails
 * collapse on mobile (left nav becomes a horizontal scroller; right rail hides).
 */
export function AppShell({
  me,
  pillar,
  section,
  children,
}: {
  me: PublicUser | null;
  pillar: Pillar;
  /** Active left-nav key (see PILLAR_NAV); omit on form/detail pages. */
  section?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <SiteHeader me={me} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <PillarTabs active={pillar} />
        <div className="mt-6 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)_16rem] lg:gap-6">
          <LeftNav pillar={pillar} section={section} className="mb-4 lg:mb-0" />
          <main className="min-w-0">{children}</main>
          <RightRail pillar={pillar} me={me} className="mt-6 hidden lg:mt-0 lg:block" />
        </div>
      </div>
    </div>
  );
}
