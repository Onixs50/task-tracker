"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Github, CheckCircle2 } from "lucide-react";
import { FadeInSection } from "@/components/fade-in-section";
import { GemStatic } from "@/components/gem";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || "";

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("about");
  const features = t.raw("features") as string[];

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href={`/${locale}/login`} className="flex items-center gap-1.5 text-sm text-muted hover:text-gold">
            <ArrowLeft size={15} className={locale === "fa" ? "rotate-180" : ""} />
            {t("back")}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <FadeInSection>
          <div className="mb-3 flex justify-center">
            <GemStatic size={64} />
          </div>
          <h1 className="text-center font-display text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">{t("intro")}</p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="mt-8 rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-sm font-semibold text-gold">{t("howTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("howBody")}</p>
          </div>
        </FadeInSection>

        <FadeInSection delay={150}>
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-sm font-semibold text-gold">{t("featuresTitle")}</h2>
            <ul className="mt-3 space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-sm font-semibold text-gold">{t("privacyTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("privacyBody")}</p>
          </div>
        </FadeInSection>

        <FadeInSection delay={250}>
          <div className="mt-8 flex flex-col items-center gap-2 text-xs text-muted">
            <span>{t("madeBy")}</span>
            {GITHUB_URL && (
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-gold">
                <Github size={14} />
                {t("githubLabel")}
              </a>
            )}
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
