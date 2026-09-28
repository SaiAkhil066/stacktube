import Image from "next/image";
import { cn } from "@/lib/format";

// Default avatar colours for channels without a photo.
const TINTS = ["#ef6c00", "#7b1fa2", "#0288d1", "#388e3c", "#c2185b", "#5d4037", "#00897b", "#3949ab"];

export function Avatar({
  name,
  image,
  size = 36,
  className,
}: {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
      />
    );
  }
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-full font-medium text-white", className)}
      style={{ width: size, height: size, background: tint, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
