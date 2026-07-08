import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PillarPlaceholder } from "@/components/PillarPlaceholder";

export default async function FellowshipPage() {
  const me = await getMe();
  return (
    <AppShell me={me} pillar="fellowship">
      <PillarPlaceholder
        title="Fellowship Social"
        tagline="A digital safe haven for worldwide fellowship — posts, feed, DMs and group chat, free from unjust censorship."
        accent="text-fellowship"
        phase="Phase 4"
      />
    </AppShell>
  );
}
