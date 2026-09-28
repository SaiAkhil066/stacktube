import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoLoginEnabled, githubConfigured, signIn } from "@/auth";
import { LogoMark } from "@/components/logo";
import { APP_NAME } from "@/lib/config";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

function safeCallback(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  const callbackUrl = safeCallback(sp.callbackUrl);
  if (await getViewer()) redirect(callbackUrl);

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <LogoMark size={44} />
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">Sign in to {APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted">
          Your GitHub account becomes your channel. We only read your public profile.
        </p>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: callbackUrl });
          }}
        >
          <button
            disabled={!githubConfigured}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-fg px-4 py-3 font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GitHubIcon />
            Continue with GitHub
          </button>
        </form>

        {demoLoginEnabled && (
          <>
            <p className="mt-4 rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-muted">
              GitHub sign-in isn&apos;t set up yet. Add <code className="font-mono">AUTH_GITHUB_ID</code> and{" "}
              <code className="font-mono">AUTH_GITHUB_SECRET</code> to <code className="font-mono">.env.local</code>. Until then,
              use the demo account (local only).
            </p>
            <form
              className="mt-3"
              action={async () => {
                "use server";
                await signIn("demo", { redirectTo: callbackUrl });
              }}
            >
              <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold hover:bg-surface-2">
                Continue as demo developer
              </button>
            </form>
          </>
        )}
        {sp.error && <p className="mt-4 text-sm text-danger">Sign-in didn&apos;t complete. Try again.</p>}
      </div>
    </div>
  );
}
