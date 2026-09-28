import Link from "next/link";
import { cn } from "@/lib/format";

export type Chip = { href: string; label: string; active: boolean; color?: string };

export function ChipBar({ chips, className }: { chips: Chip[]; className?: string }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-none", className)}>
      {chips.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          aria-current={c.active ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            c.active ? "bg-fg text-bg" : "bg-surface-2 hover:bg-line",
          )}
        >
          {c.color && <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden="true" />}
          {c.label}
        </Link>
      ))}
    </div>
  );
}
