import type { Database } from "./supabase/types";
import { addDaysISO, weekdayInTZ, isoToDate } from "./dates";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

function weekdayOfISO(iso: string): number {
  // Sunday = 0 .. Saturday = 6, computed in UTC since the ISO string has no time component
  return isoToDate(iso).getUTCDay();
}

export function isDueOn(template: TaskTemplate, iso: string): boolean {
  if (!template.active) return false;
  if (iso < template.start_date) return false;
  if (template.end_date && iso > template.end_date) return false;

  switch (template.recurrence_type) {
    case "daily":
      return true;
    case "weekly":
      return (template.recurrence_days ?? []).includes(weekdayOfISO(iso));
    case "custom_dates":
      return (template.custom_dates ?? []).includes(iso);
    case "once":
      return iso === template.start_date;
    default:
      return false;
  }
}

/** Enumerates every ISO date a template was due on within [fromISO, toISO] inclusive. */
export function dueDatesInRange(template: TaskTemplate, fromISO: string, toISO: string): string[] {
  const dates: string[] = [];
  let cursor = fromISO > template.start_date ? fromISO : template.start_date;
  const end = template.end_date && template.end_date < toISO ? template.end_date : toISO;

  // custom_dates / once are sparse — no need to walk day by day
  if (template.recurrence_type === "custom_dates") {
    return (template.custom_dates ?? []).filter((d) => d >= fromISO && d <= toISO);
  }
  if (template.recurrence_type === "once") {
    return template.start_date >= fromISO && template.start_date <= toISO ? [template.start_date] : [];
  }

  let guard = 0;
  while (cursor <= end && guard < 3660) {
    if (isDueOn(template, cursor)) dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
    guard++;
  }
  return dates;
}
