"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MeUser } from "@mellow/shared";
import { profileUpdateSchema } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";
import { TimezoneSelect } from "./TimezoneSelect";

export function ProfileForm({ me }: { me: MeUser }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(me.displayName ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [timezone, setTimezone] = useState(me.timezone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = profileUpdateSchema.safeParse({ displayName, bio, avatarUrl, timezone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setStatus("saving");
    const res = await apiFetch("/me", { method: "PATCH", body: JSON.stringify(parsed.data) });
    if (!res.ok) {
      setStatus("idle");
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save changes");
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-lg p-6">
      <h1 className="text-xl font-bold">Edit profile</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Handle">
          <Input value={me.handle ? `@${me.handle}` : ""} disabled />
        </Field>
        <Field label="Display name">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </Field>
        <Field label="Bio" hint="Up to 280 characters.">
          <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="Avatar URL">
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Timezone">
          <TimezoneSelect value={timezone} onChange={setTimezone} />
        </Field>
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save changes"}
          </Button>
          {status === "saved" && <span className="text-sm text-calling">Saved ✓</span>}
        </div>
      </form>
    </Card>
  );
}
