import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Viewer = { id: string; handle: string; name: string; image: string | null };

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    handle: session.user.handle,
    name: session.user.name ?? session.user.handle,
    image: session.user.image ?? null,
  };
});

export async function requireViewer(returnTo = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return viewer;
}
