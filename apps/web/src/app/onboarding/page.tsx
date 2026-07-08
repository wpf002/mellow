import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in");
  if (me.handle) redirect(`/${me.handle}`);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16">
      <Logo />
      <OnboardingForm defaultDisplayName={me.displayName ?? ""} />
    </div>
  );
}
