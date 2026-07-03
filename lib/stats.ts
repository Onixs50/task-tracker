import type { Database } from "./supabase/types";
import { isDueOn, dueDatesInRange } from "./recurrence";
import { addDaysISO } from "./dates";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];

export interface DaySummary {
  date: string;
  dueCount: number;
  doneCount: number;
  missedCount: number;
}

/** Builds a lookup of "template_id|date" -> log for O(1) access. */
export function indexLogs(logs: TaskLog[]): Map<string, TaskLog> {
  const map = new Map<string, TaskLog>();
  for (const log of logs) map.set(`${log.task_template_id}|${log.log_date}`, log);
  return map;
}

/** Summarizes a single day: how many tasks were due, done, and missed. */
export function summarizeDay(
  templates: TaskTemplate[],
  logIndex: Map<string, TaskLog>,
  iso: string,
  todayISO: string
): DaySummary {
  let dueCount = 0;
  let doneCount = 0;
  let missedCount = 0;

  for (const template of templates) {
    if (!isDueOn(template, iso)) continue;
    dueCount++;
    const log = logIndex.get(`${template.id}|${iso}`);
    if (log?.status === "done") {
      doneCount++;
    } else if (iso < todayISO) {
      // due in the past and never marked done → counts as missed
      missedCount++;
    }
  }

  return { date: iso, dueCount, doneCount, missedCount };
}

export function summarizeRange(
  templates: TaskTemplate[],
  logs: TaskLog[],
  fromISO: string,
  toISO: string,
  todayISO: string
): DaySummary[] {
  const logIndex = indexLogs(logs);
  const days: DaySummary[] = [];
  let cursor = fromISO;
  let guard = 0;
  while (cursor <= toISO && guard < 400) {
    days.push(summarizeDay(templates, logIndex, cursor, todayISO));
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return days;
}

/** Consecutive days (ending yesterday) where every due task was completed. */
export function computeStreak(templates: TaskTemplate[], logs: TaskLog[], todayISO: string): number {
  const logIndex = indexLogs(logs);
  let streak = 0;
  let cursor = addDaysISO(todayISO, -1);
  let guard = 0;

  while (guard < 365) {
    const summary = summarizeDay(templates, logIndex, cursor, todayISO);
    if (summary.dueCount === 0) {
      // no tasks were due that day — skip without breaking the streak
      cursor = addDaysISO(cursor, -1);
      guard++;
      continue;
    }
    if (summary.missedCount > 0) break;
    streak++;
    cursor = addDaysISO(cursor, -1);
    guard++;
  }

  return streak;
}
