"use client";

import { useTranslations } from "next-intl";

const TWITTER_URL = process.env.NEXT_PUBLIC_TWITTER_URL || "";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-10 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
      <span>{t("builtBy")}</span>
      {TWITTER_URL && (
        <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-7.2L4.3 22H1.2l8.1-9.3L1 2h7.3l5 6.6L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" />
          </svg>
        </a>
      )}
    </footer>
  );
}
