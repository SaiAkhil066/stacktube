import type { Metadata } from "next";
import { JetBrains_Mono, Roboto } from "next/font/google";
import { cookies } from "next/headers";
import { Shell } from "@/components/shell";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { getSubscribedChannels, getUnreadCount } from "@/lib/queries";
import { getViewer } from "@/lib/session";
import "./globals.css";

const ui = Roboto({ variable: "--font-ui", subsets: ["latin"], weight: ["400", "500", "700"] });
const code = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
  description: `${APP_NAME}: ${APP_TAGLINE}. Programming videos with code you can copy at the exact second it appears.`,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get("theme")?.value === "light" ? "light" : "dark";
  const viewer = await getViewer();
  const [subscriptions, unread] = viewer
    ? await Promise.all([getSubscribedChannels(viewer.id), getUnreadCount(viewer.id)])
    : [[], 0];

  return (
    <html lang="en" data-theme={theme} className={`${ui.variable} ${code.variable} antialiased`}>
      <body>
        <Shell theme={theme} viewer={viewer} subscriptions={subscriptions} unread={unread}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
