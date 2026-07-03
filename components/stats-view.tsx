"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { summarizeRange, indexLogs, summarizeDay } from "@/lib/stats";
import { addDaysISO, formatDisplayDate } from "@/lib/dates";
import type { Database } from "@/lib/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];

const RANGES = [
  { key: "range3d", days: 3 },
  { key: "rangeWeek", days: 7 },
  { key: "rangeMonth", days: 30 },
  { key: "rangeYear", days: 365 },
] as const;

export function StatsView({
  projects,
  templates,
  logs,
  todayISO,
}: {
  projects: Project[];
  templates: TaskTemplate[];
  logs: TaskLog[];
  todayISO: string;
}) {
  const t = useTranslations("stats");
  const locale = useLocale();
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);

  const fromISO = addDaysISO(todayISO, -(range.days - 1));

  const daily = useMemo(
    () => summarizeRange(templates, logs, fromISO, todayISO, todayISO),
    [templates, logs, fromISO, todayISO]
  );

  const totals = daily.reduce(
    (acc, d) => ({ done: acc.done + d.doneCount, missed: acc.missed + d.missedCount, due: acc.due + d.dueCount }),
    { done: 0, missed: 0, due: 0 }
  );
  const completionRate = totals.due > 0 ? Math.round((totals.done / totals.due) * 100) : 0;

  const byProject = useMemo(() => {
    const logIndex = indexLogs(logs);
    return projects.map((project) => {
      const projectTemplates = templates.filter((tpl) => tpl.project_id === project.id);
      let done = 0;
      let missed = 0;
      let cursor = fromISO;
      let guard = 0;
      while (cursor <= todayISO && guard < 400) {
        const s = summarizeDay(projectTemplates, logIndex, cursor, todayISO);
        done += s.doneCount;
        missed += s.missedCount;
        cursor = addDaysISO(cursor, 1);
        guard++;
      }
      return { project, done, missed };
    });
  }, [projects, templates, logs, fromISO, todayISO]);

  const chartData = daily.map((d) => ({
    date: range.days <= 30 ? formatDisplayDate(d.date, locale).slice(-5) : d.date.slice(5, 7),
    [t("done")]: d.doneCount,
    [t("missed")]: d.missedCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              range.key === r.key ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted hover:text-ink"
            }`}
          >
            {t(r.key)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("done")} value={totals.done} color="teal" />
        <StatCard label={t("missed")} value={totals.missed} color="danger" />
        <StatCard label={t("completionRate")} value={`${completionRate}%`} color="gold" />
      </div>

      {totals.due === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          {t("noData")}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={11} />
              <YAxis stroke="rgb(var(--muted))" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey={t("done")} stackId="a" fill="rgb(var(--teal))" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t("missed")} stackId="a" fill="rgb(var(--danger))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t("byProject")}</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {byProject.map(({ project, done, missed }) => (
            <li key={project.id} className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
              <span className="font-mono text-xs text-muted">
                <span className="text-teal">{done}</span> / <span className="text-danger">{missed}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const STAT_COLOR_CLASS: Record<string, string> = {
  teal: "text-teal",
  danger: "text-danger",
  gold: "text-gold",
};

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${STAT_COLOR_CLASS[color]}`}>{value}</p>
    </div>
  );
}
