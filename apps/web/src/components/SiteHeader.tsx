import Link from "next/link";
import type { PublicUser } from "@mellow/shared";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { Button } from "./ui";
import { SignOutButton } from "./SignOutButton";

export function SiteHeader({
  me,
  showAuthActions = true,
}: {
  me: PublicUser | null;
  /** Signed-out only: hide the Sign in / Sign up actions (e.g. the landing hero already has CTAs). */
  showAuthActions?: boolean;
}) {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {me ? (
            <>
              {me.handle ? (
                <Link
                  href={`/${me.handle}`}
                  className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-black/5"
                >
                  <Avatar name={me.displayName ?? me.handle} src={me.avatarUrl} size={32} />
                  <span className="text-sm font-medium">@{me.handle}</span>
                </Link>
              ) : (
                <Link href="/onboarding" className="text-sm font-medium text-brand">
                  Finish Setup
                </Link>
              )}
              <SignOutButton />
            </>
          ) : showAuthActions ? (
            <>
              <Link href="/sign-in">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Join</Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
