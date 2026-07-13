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
