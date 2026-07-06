"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { LayoutGrid, ClipboardList, BarChart3, Settings, Gift } from "lucide-react";
import { TickerBanner } from "./ticker-banner";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { SignOutButton } from "./sign-out-button";
import { Footer } from "./footer";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", key: "dashboard", icon: LayoutGrid },
  { href: "/admin", key: "admin", icon: ClipboardList },
  { href: "/stats", key: "stats", icon: BarChart3 },
  { href: "/airdrops", key: "airdrops", icon: Gift },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function AppShell({
  children,
  timezone,
  displayName,
  email,
  quotes,
  bannerSpeed,
}: {
  children: ReactNode;
  timezone: string;
  displayName: string | null;
  email: string | null;
  quotes: string[];
  bannerSpeed: number;
}) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TickerBanner timezone={timezone} quotes={quotes} bannerSpeed={bannerSpeed} />

      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal" />
            <span className="font-display text-lg font-semibold tracking-tight">{tApp("name")}</span>
          </div>

          <nav className="hidden gap-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                    active ? "bg-surface text-gold" : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon size={15} />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {displayName && (
              <span className="hidden flex-col items-end text-xs leading-tight md:flex">
                <span className="text-muted">{displayName}</span>
                {email && <span className="text-[10px] text-muted/70">{email}</span>}
              </span>
            )}
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-6 sm:pb-10">
        <div className="flex-1">{children}</div>
        <Footer />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-surface py-2 sm:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
                active ? "text-gold" : "text-muted"
              }`}
            >
              <Icon size={18} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
