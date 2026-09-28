import { APP_NAME } from "@/lib/config";

// The play button is three stacked layers in the syntax colours.
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <clipPath id="st-play">
          <path d="M12 6.5 L58 30.2 Q61.5 32 58 33.8 L12 57.5 Q8 59.5 8 55 L8 9 Q8 4.5 12 6.5 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#st-play)">
        <rect x="0" y="4" width="64" height="15.5" fill="var(--kw)" />
        <rect x="0" y="24.25" width="64" height="15.5" fill="var(--str)" />
        <rect x="0" y="44.5" width="64" height="15.5" fill="var(--fn)" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[1.3rem] font-extrabold tracking-[-0.04em]" aria-hidden="true">
        stack<span className="font-medium text-muted">tube</span>
      </span>
      <span className="sr-only">{APP_NAME} home</span>
    </span>
  );
}
