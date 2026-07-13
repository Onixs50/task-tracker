"use client";

import { useTranslations, useLocale } from "next-intl";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis, PieChart, Pie, Cell } from "recharts";
import { Eye, Users, Send, ListChecks, CheckCircle2, FolderKanban, Gift, TrendingUp } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";
import type { SiteStats } from "@/lib/site-stats";

const PIE_COLORS = ["rgb(var(--teal))", "rgb(var(--border))"];

export function SiteStatsView({ stats }: { stats: SiteStats }) {
  const t = useTranslations("siteAdmin");
  const locale = useLocale();

  if (!stats.available) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
        {t("statsUnavailable")}
      </div>
    );
  }

  const dailyChart = stats.dailyVisits.map((d) => ({
    date: formatDisplayDate(d.date, locale).slice(-5),
    [t("visits")]: d.count,
  }));

  const pageChart = stats.topPages.map((p) => ({
    path: p.path === "/" ? t("pageHome") : p.path,
    count: p.count,
  }));

  const telegramPie = [
    { name: t("linked"), value: stats.telegramLinked },
    { name: t("notLinked"), value: Math.max(stats.totalUsers - stats.telegramLinked, 0) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Eye} label={t("totalVisits")} value={stats.totalVisits} color="gold" />
        <StatCard icon={TrendingUp} label={t("visitsToday")} value={stats.visitsToday} color="teal" />
        <StatCard icon={Users} label={t("totalUsers")} value={stats.totalUsers} color="teal" />
        <StatCard icon={Send} label={t("telegramLinkedStat")} value={stats.telegramLinked} color="gold" />
        <StatCard icon={FolderKanban} label={t("totalProjectsStat")} value={stats.totalProjects} color="muted" />
        <StatCard icon={ListChecks} label={t("totalTasksStat")} value={stats.totalTasks} color="muted" />
        <StatCard icon={CheckCircle2} label={t("completedTasksStat")} value={stats.completedTaskLogs} color="teal" />
        <StatCard icon={Gift} label={t("totalAirdropsStat")} value={stats.totalAirdrops} color="gold" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 sm:col-span-2">
          <p className="mb-2 text-xs font-medium text-muted">{t("visitsChartTitle")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey={t("visits")}
                stroke="rgb(var(--gold))"
                strokeWidth={2}
                fill="url(#visitsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-medium text-muted">{t("telegramShareTitle")}</p>
          {stats.totalUsers === 0 ? (
            <div className="flex h-[160px] items-center justify-center text-xs text-muted">{t("noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={telegramPie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={2}>
                  {telegramPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--surface))",
                    border: "1px solid rgb(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {pageChart.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-medium text-muted">{t("topPagesTitle")}</p>
          <ResponsiveContainer width="100%" height={Math.max(pageChart.length * 32, 100)}>
            <BarChart data={pageChart} layout="vertical" margin={{ left: 8, right: 8 }}>
              <YAxis dataKey="path" type="category" stroke="rgb(var(--muted))" fontSize={11} width={110} />
              <XAxis type="number" hide allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="rgb(var(--teal))" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const COLOR_CLASS: Record<string, string> = {
  gold: "text-gold",
  teal: "text-teal",
  muted: "text-ink",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon size={13} />
        <p className="text-[11px] leading-tight">{label}</p>
      </div>
      <p className={`mt-1.5 font-display text-xl font-semibold ${COLOR_CLASS[color]}`}>{value.toLocaleString()}</p>
    </div>
  );
}
