"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  formatDisplayDate,
  formatGregorianOnly,
  formatWeekday,
  formatTimeInTZ,
  isoDateInTZ,
} from "@/lib/dates";

// speed 1 (slow) .. 5 (fast)
function durationForSpeed(speed: number) {
  const map: Record<number, number> = { 1: 55, 2: 42, 3: 32, 4: 22, 5: 14 };
  return map[speed] ?? 32;
}
function intervalForSpeed(speed: number) {
  const map: Record<number, number> = { 1: 10000, 2: 8500, 3: 7000, 4: 5500, 5: 4000 };
  return map[speed] ?? 7000;
}

export function TickerBanner({
  timezone,
  quotes,
  bannerSpeed,
}: {
  timezone: string;
  quotes: string[];
  bannerSpeed: number;
}) {
  const locale = useLocale() as "en" | "fa";
  const [now, setNow] = useState<Date | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const clockId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockId);
  }, []);

  const slideCount = quotes.length > 0 ? 1 + quotes.length : 1;

  useEffect(() => {
    if (slideCount < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), intervalForSpeed(bannerSpeed));
    return () => clearInterval(id);
  }, [slideCount, bannerSpeed]);

  const dir = locale === "fa" ? "rtl" : "ltr";
  const animClass = dir === "rtl" ? "animate-tickerRtl" : "animate-ticker";
  const duration = `${durationForSpeed(bannerSpeed)}s`;

  const content = useMemo(() => {
    if (!now) return null;

    if (slide > 0 && quotes[slide - 1]) {
      return (
        <>
          <span className="text-gold">✦</span>
          <span className="text-ink">{quotes[slide - 1]}</span>
        </>
      );
    }

    const iso = isoDateInTZ(timezone, now);
    const weekdayStr = formatWeekday(iso, locale);
    const timeStr = formatTimeInTZ(timezone, now);
    const jalali = formatDisplayDate(iso, "fa");
    const gregorian = formatGregorianOnly(iso);

    return (
      <>
        <span className="text-gold">●</span>
        <span className="text-ink">{weekdayStr}</span>
        {locale === "fa" ? (
          <>
            <span>{jalali}</span>
            <span className="text-muted">({gregorian})</span>
          </>
        ) : (
          <span>{gregorian}</span>
        )}
        <span className="text-teal tabular">{timeStr}</span>
        <span className="text-muted">{timezone}</span>
      </>
    );
  }, [now, slide, quotes, timezone, locale]);

  if (!content) {
    return <div className="h-11 bg-surface border-b border-border" />;
  }

  const segment = (
    <span className="inline-flex items-center gap-3 px-6 font-mono text-[13px] tracking-wide text-muted whitespace-nowrap">
      {content}
    </span>
  );

  return (
    <div className="relative h-11 overflow-hidden bg-surface border-b border-border">
      <div
        key={slide}
        className={`absolute inset-y-0 flex items-center whitespace-nowrap ${animClass}`}
        style={{ willChange: "transform", animationDuration: duration }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i}>{segment}</span>
        ))}
      </div>
    </div>
  );
}
