"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateChannel } from "@/lib/actions";

export function ChannelEditor({ name, bio }: { name: string; bio: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line">
        Customize channel
      </button>
    );
  }

  return (
    <form
      className="w-full max-w-lg space-y-3 rounded-xl border border-line bg-surface p-4"
      action={(fd) =>
        startTransition(async () => {
          const res = await updateChannel(fd);
          if (!res.ok) return setError(res.error);
          setOpen(false);
          router.refresh();
        })
      }
    >
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input name="name" defaultValue={name} maxLength={60} className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">About your channel</span>
        <textarea
          name="bio"
          defaultValue={bio}
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-surface-2">
          Cancel
        </button>
        <button disabled={pending} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50">
          Save
        </button>
      </div>
    </form>
  );
}
