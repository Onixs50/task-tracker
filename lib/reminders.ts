import { nextDailyOccurrenceUTC } from "./dates";

export type ReminderType = "once" | "daily_at" | "interval";

export function computeNextSendAt(
  type: ReminderType,
  opts: { hoursFromNow?: number; timeOfDay?: string; intervalHours?: number },
  timezone: string,
  from: Date = new Date()
): string {
  if (type === "once") {
    const hours = Math.max(0.25, opts.hoursFromNow ?? 1);
    return new Date(from.getTime() + hours * 3_600_000).toISOString();
  }
  if (type === "daily_at") {
    return nextDailyOccurrenceUTC(timezone, opts.timeOfDay ?? "20:00", from).toISOString();
  }
  const hours = Math.max(0.5, opts.intervalHours ?? 3);
  return new Date(from.getTime() + hours * 3_600_000).toISOString();
}
