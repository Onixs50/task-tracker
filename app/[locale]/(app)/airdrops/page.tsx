import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AirdropsBoard } from "@/components/airdrops-board";

export default async function AirdropsPage() {
  const supabase = createClient();
  const t = await getTranslations("airdrops");

  const { data: airdrops } = await supabase
    .from("airdrops")
    .select("*")
    .order("claim_date", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <AirdropsBoard initial={airdrops ?? []} />
    </div>
  );
}
