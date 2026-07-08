import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-full">
      <SiteHeader me={null} />
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Not found</h1>
        <p className="mt-2 text-sm text-muted">We couldn’t find that page.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Home</Button>
        </Link>
      </div>
    </div>
  );
}
