/** The mustadd "MUST" mark — four rounded blocks in the pillar colors + wordmark. */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-end gap-[3px]" aria-hidden>
        <span className="h-4 w-2.5 rounded-full bg-prayer" />
        <span className="h-4 w-2.5 rounded-full bg-fellowship" />
        <span className="h-4 w-2.5 rounded-full bg-calling" />
        <span className="relative h-4 w-4">
          <span className="absolute left-1/2 top-0 h-4 w-1.5 -translate-x-1/2 rounded-full bg-equipping" />
          <span className="absolute top-1/2 left-0 h-1.5 w-4 -translate-y-1/2 rounded-full bg-equipping" />
        </span>
      </span>
      {withWordmark && <span className="text-lg font-bold tracking-tight text-ink">mustadd</span>}
    </span>
  );
}
