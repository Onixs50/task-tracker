"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Copy, Check, Send, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SharedTaskPayload } from "@/lib/supabase/types";

export function ShareModal({
  tasks,
  locale,
  onClose,
}: {
  tasks: SharedTaskPayload[];
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("share");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function createLink() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("mustBeSignedIn"));
        setLoading(false);
        return;
      }
      const { data, error: insertError } = await supabase
        .from("shared_bundles")
        .insert({ created_by: user.id, payload: tasks })
        .select("id")
        .single();
      if (cancelled) return;
      if (insertError || !data) {
        setError(t("linkError"));
        setLoading(false);
        return;
      }
      setUrl(`${window.location.origin}/${locale}/shared/${data.id}`);
      setLoading(false);
    }
    createLink();
    return () => {
      cancelled = true;
    };
    // `t` intentionally excluded — its reference changes every render and
    // would otherwise recreate the share link (and re-insert the bundle) repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, locale]);

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("shareTitle"), text: t("shareText"), url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
    } else {
      copyLink();
    }
  }

  const shareText = encodeURIComponent(t("shareText"));
  const shareUrl = url ? encodeURIComponent(url) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-fade-up space-y-4 rounded-lg border border-border bg-surface p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">{t("title")}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted">{t("subtitle", { count: tasks.length })}</p>

        {loading && <p className="text-xs text-muted">{t("creatingLink")}</p>}
        {error && <p className="text-xs text-danger">{error}</p>}

        {url && (
          <>
            <div className="flex items-center gap-2 rounded-sm border border-border bg-bg px-2.5 py-2">
              <input readOnly dir="ltr" value={url} className="w-full bg-transparent text-xs text-muted outline-none" />
              <button onClick={copyLink} className="shrink-0 text-muted hover:text-gold">
                {copied ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={nativeShare}
                className="flex items-center justify-center gap-1.5 rounded-sm border border-gold/40 bg-gold/10 py-2 text-xs text-gold hover:bg-gold/20"
              >
                <Share2 size={13} /> {t("shareVia")}
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(t("shareTitle"))}&body=${shareText}%0A${shareUrl}`}
                className="flex items-center justify-center gap-1.5 rounded-sm border border-border py-2 text-xs text-muted hover:text-ink"
              >
                <Send size={13} /> {t("gmail")}
              </a>
              <a
                href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-sm border border-border py-2 text-xs text-muted hover:text-ink"
              >
                {t("telegram")}
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-sm border border-border py-2 text-xs text-muted hover:text-ink"
              >
                {t("twitter")}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
