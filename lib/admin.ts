/**
 * The single account that gets full site-management access (announcements,
 * etc). Real enforcement happens in Supabase RLS policies (checked against
 * the JWT email) — this constant only controls what the UI shows/hides.
 */
export const SUPER_ADMIN_EMAIL = "sadeghss500@gmail.com";

export function isSuperAdmin(email: string | null | undefined) {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
}
