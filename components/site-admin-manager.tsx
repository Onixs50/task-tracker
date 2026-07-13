"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ShieldCheck, Shield } from "lucide-react";
import type { SiteAdminEntry } from "@/lib/admin";

export function SiteAdminManager({
  initialAdmins,
  canManage,
}: {
  initialAdmins: SiteAdminEntry[];
  canManage: boolean;
}) {
  const t = useTranslations("siteAdmin");
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addAdmin() {
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/site-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(t("addAdminError"));
        return;
      }
      setAdmins((prev) => [{ email: data.email, isOwner: false, created_at: new Date().toISOString() }, ...prev]);
      setEmail("");
    } catch {
      setError(t("addAdminError"));
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(target: string) {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    try {
      await fetch("/api/site-admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      setAdmins((prev) => prev.filter((a) => a.email !== target));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("adminsTitle")}</h2>
        <p className="mt-1 text-xs text-muted">{t("adminsSubtitle")}</p>
      </div>

      {canManage && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("adminEmailPlaceholder")}
            className="flex-1 rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
          <button
            onClick={addAdmin}
            disabled={busy || !email.trim()}
            className="flex items-center justify-center gap-1 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted hover:text-gold disabled:opacity-50"
          >
            <Plus size={13} /> {t("addAdmin")}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}

      <ul className="divide-y divide-border rounded-md border border-border bg-surface">
        {admins.map((a) => (
          <li key={a.email} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {a.isOwner ? (
                <ShieldCheck size={15} className="shrink-0 text-gold" />
              ) : (
                <Shield size={15} className="shrink-0 text-teal" />
              )}
              <div className="min-w-0">
                <p dir="ltr" className="truncate text-left text-sm">
                  {a.email}
                </p>
                <p className="text-[11px] text-muted/70">{a.isOwner ? t("ownerLabel") : t("adminLabel")}</p>
              </div>
            </div>
            {!a.isOwner && canManage && (
              <Trash2
                size={14}
                className="shrink-0 cursor-pointer text-muted hover:text-danger"
                onClick={() => removeAdmin(a.email)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
