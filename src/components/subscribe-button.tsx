"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { toggleSubscription } from "@/lib/actions";
import { cn } from "@/lib/format";

export function SubscribeButton({
  channelId,
  subscribed,
  signedIn,
  isSelf,
}: {
  channelId: string;
  subscribed: boolean;
  signedIn: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(subscribed);
  const [, startTransition] = useTransition();
  if (isSelf) return null;

  return (
    <button
      onClick={() => {
        if (!signedIn) return router.push("/signin");
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleSubscription(channelId);
          router.refresh();
        });
      }}
      aria-pressed={optimistic}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        optimistic ? "bg-surface-2 hover:bg-line" : "bg-fg text-bg hover:opacity-85",
      )}
    >
      {optimistic && <BellRing className="size-4" aria-hidden="true" />}
      {optimistic ? "Subscribed" : "Subscribe"}
    </button>
  );
}
