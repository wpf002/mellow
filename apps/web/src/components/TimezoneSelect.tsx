"use client";
import { useMemo } from "react";
import { cn } from "./ui";

function tzList(): string[] {
  const anyIntl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  if (typeof anyIntl.supportedValuesOf === "function") {
    return anyIntl.supportedValuesOf("timeZone");
  }
  // Fallback list if the runtime lacks Intl.supportedValuesOf.
  return ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Seoul"];
}

export function TimezoneSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const zones = useMemo(tzList, []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-prayer-soft",
        className,
      )}
    >
      {!zones.includes(value) && <option value={value}>{value}</option>}
      {zones.map((z) => (
        <option key={z} value={z}>
          {z}
        </option>
      ))}
    </select>
  );
}

export function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
