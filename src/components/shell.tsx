"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Bell,
  Clock,
  Flame,
  GraduationCap,
  History,
  Home,
  Laugh,
  ListVideo,
  LogOut,
  Menu,
  Mic,
  Moon,
  Plus,
  Search,
  Smartphone,
  Sun,
  ThumbsUp,
  Tv,
  UserSquare,
  Video,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/format";
import type { Viewer } from "@/lib/session";

type Channel = { id: string; handle: string; name: string; image: string | null };

export function Shell({
  viewer,
  subscriptions,
  unread,
  theme,
  children,
}: {
  theme: "dark" | "light";
  viewer: Viewer | null;
  subscriptions: Channel[];
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Watching gets the full width; the sidebar becomes a drawer.
  const immersive = pathname.startsWith("/watch") || pathname.startsWith("/shorts");
  // Phones get the YouTube-app tab bar everywhere except while watching.
  const showTabs = !pathname.startsWith("/watch");
  const [expanded, setExpanded] = useState(true);
  const [drawer, setDrawer] = useState(false);

  // Close the drawer when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawer(false);
  }

  function toggle() {
    if (immersive || window.matchMedia("(max-width: 1023px)").matches) setDrawer((d) => !d);
    else setExpanded((e) => !e);
  }

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <TopBar viewer={viewer} unread={unread} theme={theme} onMenu={toggle} />
      <div className="flex">
        {!immersive && (
          <aside
            className={cn(
              "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-y-auto scrollbar-thin lg:block",
              expanded ? "w-60" : "w-[4.5rem]",
            )}
          >
            {expanded ? <SidebarFull viewer={viewer} subscriptions={subscriptions} /> : <SidebarMini viewer={viewer} />}
          </aside>
        )}
        <main id="main" className={cn("min-w-0 flex-1", showTabs && "pb-16 sm:pb-0")}>
          {children}
        </main>
      </div>
      {showTabs && <BottomTabs viewer={viewer} />}

      {drawer && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Close menu" className="absolute inset-0 bg-[var(--overlay)]" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-bg shadow-2xl scrollbar-thin">
            <div className="flex h-14 items-center gap-3 px-4">
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
              <Link href="/">
                <Logo />
              </Link>
            </div>
            <SidebarFull viewer={viewer} subscriptions={subscriptions} />
          </aside>
        </div>
      )}
    </div>
  );
}

function TopBar({ viewer, unread, theme, onMenu }: { viewer: Viewer | null; unread: number; theme: "dark" | "light"; onMenu: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-bg px-3 sm:border-b sm:border-line/60 sm:px-4">
      {searchOpen ? (
        <div className="flex flex-1 items-center gap-2 sm:hidden">
          <button onClick={() => setSearchOpen(false)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close search">
            <X className="size-5" />
          </button>
          <SearchBox autoFocus />
        </div>
      ) : null}
      <div className={cn("flex shrink-0 items-center gap-1 sm:gap-3", searchOpen && "hidden sm:flex")}>
        <button onClick={onMenu} className="hidden rounded-full p-2 hover:bg-surface-2 sm:inline-flex" aria-label="Menu">
          <Menu className="size-5" />
        </button>
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
      </div>
      <div className="hidden flex-1 justify-center px-4 sm:flex">
        <SearchBox />
      </div>
      <div className={cn("ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2", searchOpen && "hidden sm:flex")}>
        <button onClick={() => setSearchOpen(true)} className="rounded-full p-2 hover:bg-surface-2 sm:hidden" aria-label="Search">
          <Search className="size-5" />
        </button>
        {viewer ? (
          <>
            <Link
              href="/studio/upload"
              className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-line sm:flex"
            >
              <Plus className="size-4" />
              <span className="hidden md:inline">Create</span>
            </Link>
            <Link href="/feed/notifications" className="relative rounded-full p-2 hover:bg-surface-2" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] leading-4 font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <AccountMenu viewer={viewer} theme={theme} />
          </>
        ) : (
          <>
            <ThemeToggle initial={theme} />
            <Link
              href="/signin"
              className="flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-link hover:bg-surface-2"
            >
              <UserSquare className="size-4" />
              Sign in
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function SearchBox({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(pathname === "/results" ? (params.get("q") ?? "") : "");

  // Press "/" anywhere to jump to search, like GitHub.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      className="flex w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/results?q=${encodeURIComponent(term)}`);
      }}
    >
      <label className="flex flex-1 items-center gap-2 rounded-l-full border border-line bg-surface px-4 focus-within:border-link">
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span className="sr-only">Search videos</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, topics, channels"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] text-muted md:block">/</kbd>
      </label>
      <button type="submit" className="rounded-r-full border border-l-0 border-line bg-surface-2 px-5 hover:bg-line" aria-label="Search">
        <Search className="size-5" />
      </button>
    </form>
  );
}

function ThemeToggle({ initial, withLabel }: { initial: "dark" | "light"; withLabel?: boolean }) {
  const [theme, setThemeState] = useState(initial);
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      onClick={() => {
        document.documentElement.dataset.theme = next;
        setThemeState(next);
        document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cn("flex items-center gap-3 rounded-full hover:bg-surface-2", withLabel ? "w-full rounded-lg px-4 py-2 text-left text-sm" : "p-2")}
      aria-label={`Switch to ${next} theme`}
    >
      <Icon className="size-5" />
      {withLabel && <span>{next === "light" ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
}

function AccountMenu({ viewer, theme }: { viewer: Viewer; theme: "dark" | "light" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded-full p-1" aria-expanded={open} aria-label="Account menu">
        <Avatar name={viewer.name} image={viewer.image} size={32} />
      </button>
      {open && (
        <div className="absolute top-11 right-0 w-64 overflow-hidden rounded-xl border border-line bg-surface py-2 shadow-2xl">
          <div className="flex gap-3 border-b border-line px-4 pt-1 pb-3">
            <Avatar name={viewer.name} image={viewer.image} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{viewer.name}</p>
              <p className="truncate text-sm text-muted">@{viewer.handle}</p>
              <Link href={`/@${viewer.handle}`} className="text-sm text-link hover:underline">
                View your channel
              </Link>
            </div>
          </div>
          <nav className="py-1 text-sm">
            <MenuLink href="/studio" icon={Video} label="Studio" />
            <MenuLink href="/feed/history" icon={History} label="History" />
            <ThemeToggle initial={theme} withLabel />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left hover:bg-surface-2"
            >
              <LogOut className="size-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-surface-2">
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  mini,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  mini?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [path, query] = href.split("?");
  const active = pathname === path && (!query || params.toString() === query);
  if (mini) {
    return (
      <Link
        href={href}
        className={cn("flex flex-col items-center gap-1 rounded-lg py-3.5 text-[10px] hover:bg-surface-2", active && "font-medium")}
      >
        <Icon className="size-5" />
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-5 rounded-lg px-3 py-2 text-sm hover:bg-surface-2", active && "bg-surface-2 font-medium")}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line/70 px-3 py-3 last:border-0">
      {title && <h2 className="px-3 pb-1.5 text-[15px] font-medium">{title}</h2>}
      {children}
    </div>
  );
}

function SidebarFull({ viewer, subscriptions }: { viewer: Viewer | null; subscriptions: Channel[] }) {
  return (
    <nav aria-label="Main">
      <Section>
        <NavItem href="/" icon={Home} label="Home" />
        <NavItem href="/shorts" icon={Smartphone} label="Shorts" />
        <NavItem href="/feed/subscriptions" icon={Tv} label="Subscriptions" />
      </Section>
      {viewer ? (
        <Section title="You">
          <NavItem href={`/@${viewer.handle}`} icon={UserSquare} label="Your channel" />
          <NavItem href="/feed/history" icon={History} label="History" />
          <NavItem href="/feed/playlists" icon={ListVideo} label="Playlists" />
          <NavItem href="/playlist?list=WL" icon={Clock} label="Watch later" />
          <NavItem href="/playlist?list=LL" icon={ThumbsUp} label="Liked videos" />
          <NavItem href="/studio" icon={Video} label="Your videos" />
        </Section>
      ) : (
        <Section>
          <p className="px-3 pb-3 text-sm text-muted">Sign in to like videos, comment and subscribe.</p>
          <Link
            href="/signin"
            className="mx-3 inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-link hover:bg-surface-2"
          >
            <UserSquare className="size-4" />
            Sign in
          </Link>
        </Section>
      )}
      {subscriptions.length > 0 && (
        <Section title="Subscriptions">
          {subscriptions.map((c) => (
            <Link key={c.id} href={`/@${c.handle}`} className="flex items-center gap-4 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
              <Avatar name={c.name} image={c.image} size={24} />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </Section>
      )}
      <Section title="Explore">
        <NavItem href="/feed/trending" icon={Flame} label="Trending" />
        <NavItem href="/?category=comedy" icon={Laugh} label="Funny" />
        <NavItem href="/?category=tutorial" icon={GraduationCap} label="Tutorials" />
        <NavItem href="/?category=talk" icon={Mic} label="Talks" />
      </Section>
      <p className="px-6 py-4 text-xs leading-relaxed text-muted">
        A learning project. Videos play from YouTube and belong to their creators.
      </p>
    </nav>
  );
}

function SidebarMini({ viewer }: { viewer: Viewer | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col px-1 pt-1">
      <NavItem mini href="/" icon={Home} label="Home" />
      <NavItem mini href="/shorts" icon={Smartphone} label="Shorts" />
      <NavItem mini href="/feed/subscriptions" icon={Tv} label="Subscriptions" />
      <NavItem mini href={viewer ? "/feed/you" : "/signin"} icon={UserSquare} label="You" />
    </nav>
  );
}

// The bottom tab bar from the YouTube app, phones only.
function BottomTabs({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", icon: Home, label: "Home", active: pathname === "/" },
    { href: "/shorts", icon: Smartphone, label: "Shorts", active: pathname.startsWith("/shorts") },
    null,
    { href: "/feed/subscriptions", icon: Tv, label: "Subscriptions", active: pathname === "/feed/subscriptions" },
    { href: viewer ? "/feed/you" : "/signin", icon: UserSquare, label: "You", active: pathname === "/feed/you" },
  ];
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line/60 bg-bg pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {tabs.map((t) =>
        t ? (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[10px]", t.active ? "font-medium" : "text-fg/75")}
          >
            <t.icon className={cn("size-6", t.active && "stroke-[2.4]")} />
            {t.label}
          </Link>
        ) : (
          <Link
            key="create"
            href={viewer ? "/studio/upload" : "/signin?callbackUrl=/studio/upload"}
            aria-label="Create"
            className="grid h-14 place-items-center"
          >
            <span className="grid size-10 place-items-center rounded-full border border-line bg-surface-2">
              <Plus className="size-6" />
            </span>
          </Link>
        ),
      )}
    </nav>
  );
}
