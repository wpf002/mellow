import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PillarPlaceholder } from "@/components/PillarPlaceholder";

export default async function CallingPage() {
  const me = await getMe();
  return (
    <AppShell me={me} pillar="calling">
      <PillarPlaceholder
        title="Calling Center"
        tagline="A calling-oriented community — jobs, freelance projects, ministries and talent matching for Christians worldwide."
        accent="text-calling"
        phase="a later phase"
      />
    </AppShell>
  );
}
