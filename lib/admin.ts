import { createServiceClient } from "@/lib/supabase/service";

/**
 * The owner account — always has full site-management access and is the
 * only one who can grant/revoke access for other admins. This can't be
 * removed from the UI, only changed here.
 */
export const SUPER_ADMIN_EMAIL = "sadeghss500@gmail.com";

export function isSuperAdmin(email: string | null | undefined) {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

/**
 * Owner OR anyone the owner has added via the Admins tab. Falls back to
 * owner-only if the service role key isn't configured yet, same pattern
 * used elsewhere in this app (see the telegram linked-count lookup).
 */
export async function isSiteAdmin(email: string | null | undefined): Promise<boolean> {
  if (isSuperAdmin(email)) return true;
  if (!email) return false;
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("site_admins")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export interface SiteAdminEntry {
  email: string;
  isOwner: boolean;
  created_at: string | null;
}

/** Full admin roster (owner first) — used by the Admins tab. */
export async function listSiteAdmins(): Promise<SiteAdminEntry[]> {
  const owner: SiteAdminEntry = { email: SUPER_ADMIN_EMAIL, isOwner: true, created_at: null };
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("site_admins")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    const extra = (data ?? []).map((row) => ({ email: row.email, isOwner: false, created_at: row.created_at }));
    return [owner, ...extra];
  } catch {
    return [owner];
  }
}

/**
 * Telegram chat ids for every admin who has linked their account. Used to
 * forward "Feedback & suggestions" messages sent through the bot. Admins
 * who haven't linked Telegram yet are simply skipped.
 */
export async function getAdminTelegramChatIds(): Promise<string[]> {
  try {
    const admins = await listSiteAdmins();
    const service = createServiceClient();
    const { data: users } = await service.auth.admin.listUsers({ perPage: 1000 });
    const emailToId = new Map((users?.users ?? []).map((u) => [u.email?.toLowerCase(), u.id]));
    const adminIds = admins.map((a) => emailToId.get(a.email.toLowerCase())).filter((id): id is string => !!id);
    if (adminIds.length === 0) return [];
    const { data: profiles } = await service
      .from("profiles")
      .select("id, telegram_chat_id")
      .in("id", adminIds)
      .not("telegram_chat_id", "is", null);
    return (profiles ?? []).map((p) => p.telegram_chat_id!).filter(Boolean);
  } catch {
    return [];
  }
}
