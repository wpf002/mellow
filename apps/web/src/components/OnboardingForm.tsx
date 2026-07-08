"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input } from "./ui";
import { TimezoneSelect, guessTimezone } from "./TimezoneSelect";

export function OnboardingForm({ defaultDisplayName }: { defaultDisplayName: string }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [timezone, setTimezone] = useState(guessTimezone());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = onboardingSchema.safeParse({ handle, displayName, timezone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setLoading(true);
    const res = await apiFetch("/me", { method: "PATCH", body: JSON.stringify(parsed.data) });
    setLoading(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save your profile");
      return;
    }
    router.push(`/${parsed.data.handle}`);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md p-6">
      <h1 className="text-xl font-bold">Set up your profile</h1>
      <p className="mt-1 text-sm text-muted">Pick a handle — this can’t be changed later.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Handle" hint="Lowercase letters, numbers, underscores. 3–20 characters.">
          <div className="flex items-center rounded-xl border border-line bg-white pl-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-prayer-soft">
            <span className="text-sm text-muted">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
              placeholder="yourname"
              required
            />
          </div>
        </Field>
        <Field label="Display name">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </Field>
        <Field label="Timezone" hint="Used to compute your prayer streaks correctly.">
          <TimezoneSelect value={timezone} onChange={setTimezone} />
        </Field>
        {error && <p className="text-sm text-brand">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Continue"}
        </Button>
      </form>
    </Card>
  );
}
