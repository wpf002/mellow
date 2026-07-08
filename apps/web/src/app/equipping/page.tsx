import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PillarPlaceholder } from "@/components/PillarPlaceholder";

export default async function EquippingPage() {
  const me = await getMe();
  return (
    <AppShell me={me} pillar="equipping">
      <PillarPlaceholder
        title="Equipping Center"
        tagline="A digital hub for empowering and nurturing Christians to fulfill their callings — courses, discipleship and mentorship."
        accent="text-equipping"
        phase="a later phase"
      />
    </AppShell>
  );
}
