/**
 * Deterministic date formatting (fixed locale + UTC) so server and client render
 * identical strings and React doesn't warn about hydration mismatches.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
