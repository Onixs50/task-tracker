import { format as formatGregorian } from "date-fns";
import { format as formatJalaliFn } from "date-fns-jalali";

/** Returns the ISO (yyyy-MM-dd) calendar date for "now" in the given IANA timezone. */
export function isoDateInTZ(timezone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** 0-23, computed in the given timezone. */
export function hourInTZ(timezone: string, date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false }).format(date);
  return parseInt(hour, 10) % 24;
}

/** 0 = Sunday .. 6 = Saturday, computed in the given timezone. */
export function weekdayInTZ(timezone: string, date: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday];
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Formats an ISO date for display, switching calendar system by locale. */
export function formatGregorianOnly(iso: string): string {
  return formatGregorian(isoToDate(iso), "MMM d, yyyy");
}

export function formatDisplayDate(iso: string, locale: string): string {
  const date = isoToDate(iso);
  if (locale === "fa") {
    return formatJalaliFn(date, "yyyy/MM/dd");
  }
  return formatGregorian(date, "MMM d, yyyy");
}

export function formatWeekday(iso: string, locale: string): string {
  const date = isoToDate(iso);
  if (locale === "fa") {
    return formatJalaliFn(date, "EEEE");
  }
  return formatGregorian(date, "EEEE");
}

/** Live clock string in a timezone, 24h digital format. */
export function formatTimeInTZ(timezone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
