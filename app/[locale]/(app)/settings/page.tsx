import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = createClient();
  const t = await getTranslations("settings");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}
