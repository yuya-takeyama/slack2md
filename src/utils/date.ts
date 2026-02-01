import { format, getISOWeek, getISOWeekYear, parse } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export type PartitionType = "daily" | "weekly" | "monthly";

export function parseDateRange(
  from: string,
  to: string,
  timezone: string,
): { oldest: number; latest: number } {
  const fromDate = parse(from, "yyyy-MM-dd", new Date());
  const toDate = parse(to, "yyyy-MM-dd", new Date());

  const fromZoned = fromZonedTime(fromDate, timezone);
  const toZoned = fromZonedTime(toDate, timezone);

  toZoned.setDate(toZoned.getDate() + 1);

  return {
    oldest: fromZoned.getTime(),
    latest: toZoned.getTime(),
  };
}

export function getPartitionKey(
  timestamp: number,
  partition: PartitionType,
  timezone: string,
): string {
  const date = toZonedTime(new Date(timestamp), timezone);

  switch (partition) {
    case "daily":
      return format(date, "yyyy-MM-dd");
    case "weekly": {
      const year = getISOWeekYear(date);
      const week = getISOWeek(date);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly":
      return format(date, "yyyy-MM");
  }
}

export function formatTimestamp(timestamp: number, timezone: string): string {
  const date = toZonedTime(new Date(timestamp), timezone);
  return format(date, "yyyy-MM-dd HH:mm:ss");
}
