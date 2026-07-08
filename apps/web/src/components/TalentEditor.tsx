"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertTalentSchema, type Talent } from "@mellow/shared";
import { apiFetch } from "@/lib/api";
import { Button, Card, Field, Input, Textarea } from "./ui";

/** Create/update the viewer's opt-in talent-directory entry. */
export function TalentEditor({ initial }: { initial: Talent | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [about, setAbout] = useState(initial?.about ?? "");
  const [skillsText, setSkillsText] = useState(initial?.skills.join(", ") ?? "");
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = upsertTalentSchema.safeParse({ headline, about, skills, availability, visible });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setSubmitting(true);
    const res = await apiFetch("/talent", { method: "PUT", body: JSON.stringify(parsed.data) });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save your profile. Please try again.");
      return;
    }
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button className="bg-calling hover:brightness-95" onClick={() => setOpen(true)}>
          {initial ? "Edit" : "Join"}
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 p-6">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Headline">
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Worship leader & songwriter open to serve" maxLength={120} />
        </Field>
        <Field label="About" hint="Optional.">
          <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} maxLength={2000} />
        </Field>
        <Field label="Skills" hint="Comma-separated, up to 20.">
          <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="worship, guitar, youth ministry" />
        </Field>
        <Field label="Availability" hint="Optional — e.g. “Evenings + weekends”.">
          <Input value={availability} onChange={(e) => setAvailability(e.target.value)} maxLength={120} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Show me in the directory
        </label>

        {error && <p className="text-sm text-brand">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="bg-calling hover:brightness-95">
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
