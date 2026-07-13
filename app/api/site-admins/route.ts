import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/admin";

/** Only the owner can grant or revoke site-admin access. */
async function requireOwner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isSuperAdmin(user?.email)) return null;
  return user!;
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { email } = await request.json().catch(() => ({ email: "" }));
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }
  if (normalized === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: "already-owner" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.from("site_admins").upsert({ email: normalized, added_by: owner.id });
  if (error) return NextResponse.json({ ok: false, error: "db-error" }, { status: 500 });

  return NextResponse.json({ ok: true, email: normalized });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { email } = await request.json().catch(() => ({ email: "" }));
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalized) return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service.from("site_admins").delete().eq("email", normalized);
  if (error) return NextResponse.json({ ok: false, error: "db-error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
