import { APP_NAME } from "@/lib/config";

// A red tile with a play button built from three stacked bars.
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="2 12 60 40" width={size * 1.5} height={size} className={className} aria-hidden="true">
      <rect x="2" y="12" width="60" height="40" rx="11" fill="#FF0033" />
      <clipPath id="st-play">
        <path d="M27 21.5 L44.5 30.6 Q47 32 44.5 33.4 L27 42.5 Q24.5 43.8 24.5 41 V23 Q24.5 20.2 27 21.5 Z" />
      </clipPath>
      <g clipPath="url(#st-play)" fill="#FFFFFF">
        <rect x="20" y="20" width="30" height="7.2" />
        <rect x="20" y="28.6" width="30" height="6.8" />
        <rect x="20" y="36.8" width="30" height="7.2" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-1">
      <LogoMark size={20} />
      <span className="text-[1.3rem] font-bold tracking-[-0.06em]" aria-hidden="true">
        StackTube
      </span>
      <span className="sr-only">{APP_NAME} home</span>
    </span>
  );
}
