import { createServiceClient } from "@/lib/supabase/service";

export interface DailyVisits {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface PagePopularity {
  path: string;
  count: number;
}

export interface SiteStats {
  available: boolean; // false when SUPABASE_SERVICE_ROLE_KEY isn't configured yet
  totalVisits: number;
  visitsToday: number;
  visitsLast7Days: number;
  dailyVisits: DailyVisits[]; // last 14 days, oldest first
  topPages: PagePopularity[]; // top 6 by visit count in the last 30 days
  totalUsers: number;
  telegramLinked: number;
  totalProjects: number;
  totalTasks: number;
  completedTaskLogs: number;
  totalAirdrops: number;
}

const EMPTY_STATS: SiteStats = {
  available: false,
  totalVisits: 0,
  visitsToday: 0,
  visitsLast7Days: 0,
  dailyVisits: [],
  topPages: [],
  totalUsers: 0,
  telegramLinked: 0,
  totalProjects: 0,
  totalTasks: 0,
  completedTaskLogs: 0,
  totalAirdrops: 0,
};

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Pulls every number shown on the Stats tab in one pass. Uses the
 * service-role client since page_views/profiles counts need to look
 * across all users, which normal RLS-scoped sessions can't do.
 */
export async function getSiteStats(): Promise<SiteStats> {
  let service;
  try {
    service = createServiceClient();
  } catch {
    return EMPTY_STATS;
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 86400000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * 86400000);

  const [
    totalVisitsRes,
    visitsTodayRes,
    visitsLast7Res,
    recentRowsRes,
    usersRes,
    linkedRes,
    projectsRes,
    tasksRes,
    completedLogsRes,
    airdropsRes,
  ] = await Promise.all([
    service.from("page_views").select("id", { count: "exact", head: true }),
    service.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    service.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
    service
      .from("page_views")
      .select("path, created_at")
      .gte("created_at", fourteenDaysAgo < thirtyDaysAgo ? thirtyDaysAgo.toISOString() : fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    service.from("profiles").select("id", { count: "exact", head: true }),
    service.from("profiles").select("id", { count: "exact", head: true }).not("telegram_chat_id", "is", null),
    service.from("projects").select("id", { count: "exact", head: true }),
    service.from("task_templates").select("id", { count: "exact", head: true }),
    service.from("task_logs").select("id", { count: "exact", head: true }).eq("status", "done"),
    service.from("airdrops").select("id", { count: "exact", head: true }),
  ]);

  // build the last-14-days series
  const dayBuckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    dayBuckets.set(isoDay(new Date(todayStart.getTime() - i * 86400000)), 0);
  }
  const pageBuckets = new Map<string, number>();
  for (const row of recentRowsRes.data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (dayBuckets.has(day)) dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
    pageBuckets.set(row.path, (pageBuckets.get(row.path) ?? 0) + 1);
  }

  const dailyVisits: DailyVisits[] = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));
  const topPages: PagePopularity[] = Array.from(pageBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, count]) => ({ path, count }));

  return {
    available: true,
    totalVisits: totalVisitsRes.count ?? 0,
    visitsToday: visitsTodayRes.count ?? 0,
    visitsLast7Days: visitsLast7Res.count ?? 0,
    dailyVisits,
    topPages,
    totalUsers: usersRes.count ?? 0,
    telegramLinked: linkedRes.count ?? 0,
    totalProjects: projectsRes.count ?? 0,
    totalTasks: tasksRes.count ?? 0,
    completedTaskLogs: completedLogsRes.count ?? 0,
    totalAirdrops: airdropsRes.count ?? 0,
  };
}
