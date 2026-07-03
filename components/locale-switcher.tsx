"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  function switchTo(next: string) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center rounded-md border border-border bg-surface p-0.5 text-xs font-mono">
      {(["en", "fa"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`rounded-sm px-2 py-1 transition ${
            locale === l ? "bg-gold/15 text-gold" : "text-muted hover:text-ink"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
