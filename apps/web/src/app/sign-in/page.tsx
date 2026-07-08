import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { SignInForm } from "@/components/SignInForm";

export default async function SignInPage() {
  const me = await getMe();
  if (me) redirect(me.handle ? "/" : "/onboarding");

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16">
      <Link href="/">
        <Logo />
      </Link>
      <SignInForm />
    </div>
  );
}
