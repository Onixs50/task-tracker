import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SharedImport } from "@/components/shared-import";
import type { SharedTaskPayload } from "@/lib/supabase/types";

export default async function SharedBundlePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createClient();
  const t = await getTranslations("share");

  const { data: bundle } = await supabase
    .from("shared_bundles")
    .select("id, payload, from_username")
    .eq("id", params.id)
    .maybeSingle();

  if (!bundle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <p className="text-sm text-muted">{t("notFound")}</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let projects: { id: string; name: string; color: string }[] = [];
  if (user) {
    const { data } = await supabase.from("projects").select("id, name, color").order("created_at");
    projects = data ?? [];
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <SharedImport
        tasks={(bundle.payload as SharedTaskPayload[]) ?? []}
        projects={projects}
        isLoggedIn={!!user}
        locale={params.locale}
        bundleId={params.id}
        fromUsername={bundle.from_username ?? null}
      />
    </div>
  );
}
