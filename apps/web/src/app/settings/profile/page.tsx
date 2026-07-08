import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfileSettingsPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (!me.handle) redirect("/onboarding");

  return (
    <AppShell me={me} pillar="prayer">
      <ProfileForm me={me} />
    </AppShell>
  );
}
