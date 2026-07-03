"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  formatDisplayDate,
  formatGregorianOnly,
  formatWeekday,
  formatTimeInTZ,
  isoDateInTZ,
} from "@/lib/dates";
import { QUOTES } from "@/lib/quotes";

export function TickerBanner({ timezone, showQuotes }: { timezone: string; showQuotes: boolean }) {
  const locale = useLocale() as "en" | "fa";
  const tDays = useTranslations("days");
  const [now, setNow] = useState<Date | null>(null);
  const [slide, setSlide] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const clockId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockId);
  }, []);

  const slideCount = showQuotes ? 2 : 1;

  useEffect(() => {
    if (slideCount < 2) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % slideCount);
      setQuoteIdx(Math.floor(Math.random() * QUOTES.en.length));
    }, 7000);
    return () => clearInterval(id);
  }, [slideCount]);

  const dir = locale === "fa" ? "rtl" : "ltr";
  const animClass = dir === "rtl" ? "animate-tickerRtl" : "animate-ticker";

  const content = useMemo(() => {
    if (!now) return null;

    if (slide === 1 && showQuotes) {
      return (
        <>
          <span className="text-gold">✦</span>
          <span className="text-ink">{QUOTES.en[quoteIdx]}</span>
          <span className="text-muted">·</span>
          <span className="text-teal">{QUOTES.fa[quoteIdx]}</span>
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
  }, [now, slide, quoteIdx, showQuotes, timezone, locale]);

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
        style={{ willChange: "transform" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i}>{segment}</span>
        ))}
      </div>
    </div>
  );
}
