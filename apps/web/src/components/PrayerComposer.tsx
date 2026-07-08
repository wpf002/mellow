"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrayerSchema, type Prayer, type PrayerVisibility } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";
import { CompanionAssist } from "./CompanionAssist";

const visibilityOptions: { value: PrayerVisibility; label: string; hint: string }[] = [
  { value: "PUBLIC", label: "Public", hint: "Anyone on Mellow can see and pray for this." },
  { value: "FRIENDS", label: "Friends only", hint: "Only people you mutually follow can see this." },
  { value: "PRIVATE", label: "Private", hint: "Only you can see this." },
];

export function PrayerComposer({ companionEnabled = false }: { companionEnabled?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<PrayerVisibility>("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createPrayerSchema.safeParse({ title, body, imageUrl, visibility });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }

    setSubmitting(true);
    const res = await apiFetch("/prayers", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    if (!res.ok) {
      setError("Could not post your prayer. Please try again.");
      return;
    }
    const prayer = (await res.json()) as Prayer;
    router.push(`/prayers/${prayer.id}`);
  }

  const activeHint = visibilityOptions.find((o) => o.value === visibility)?.hint;

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" hint="Optional — a short heading for your request.">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Healing for my mother"
            maxLength={120}
          />
        </Field>
        <Field label="Prayer request">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share what you'd like others to pray for…"
            rows={5}
            maxLength={2000}
            required
          />
        </Field>
        {companionEnabled && (
          <CompanionAssist draft={body} onUseSuggestion={(text) => setBody(text)} />
        )}

        <Field label="Image URL" hint="Optional — link to an image to accompany your prayer.">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </Field>
        {imageUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="max-h-56 w-full rounded-xl border border-line object-cover"
          />
        )}

        <Field label="Who can see this" hint={activeHint}>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PrayerVisibility)}
            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-prayer-soft"
          >
            {visibilityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-brand">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post prayer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
