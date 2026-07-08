import { cn } from "./ui";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      style={dim}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-prayer-soft text-sm font-semibold text-prayer",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
