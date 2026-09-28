"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

// The body is server-rendered markdown; this only handles expand/collapse.
export function DescriptionBox({ meta, children }: { meta: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn("rounded-xl bg-surface-2 p-3 text-sm", !open && "cursor-pointer hover:bg-line/70")}
      onClick={() => !open && setOpen(true)}
    >
      <p className="font-semibold">{meta}</p>
      <div className={cn("relative mt-1", !open && "max-h-[4.8rem] overflow-hidden")}>{children}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="mt-1 font-semibold"
        aria-expanded={open}
      >
        {open ? "Show less" : "...more"}
      </button>
    </div>
  );
}
