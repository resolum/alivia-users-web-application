import type { HomeAgendaItem, HomeTimeRange } from './home.view-model.ts';

/** PENDING(confirm): business time zone used by the assisted-care operation. */
export const BUSINESS_TIME_ZONE = 'America/Lima';

export interface RelativeDayLabels {
  readonly today: string;
  readonly tomorrow: string;
}

interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDateParts(date: string): DateParts {
  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const isValid =
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31;
  if (!isValid) {
    throw new Error(`Invalid local date "${date}".`);
  }
  return { year, month, day };
}

function toLocalDate(date: string): Date {
  const { year, month, day } = parseDateParts(date);
  return new Date(year, month - 1, day);
}

function readDatePart(parts: readonly Intl.DateTimeFormatPart[], type: string): string {
  const part = parts.find((candidate) => candidate.type === type);
  if (!part) {
    throw new Error(`Missing "${type}" in the business-zone date.`);
  }
  return part.value;
}

/** Today's date in the business zone, formatted as YYYY-MM-DD. */
export function todayInBusinessZone(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return [
    readDatePart(parts, 'year'),
    readDatePart(parts, 'month'),
    readDatePart(parts, 'day'),
  ].join('-');
}

/** Adds days to an ISO local date without going through UTC. */
export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDateParts(date);
  const value = new Date(year, month - 1, day + days);
  return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
}

/** Long localized date, capitalized for use as a heading. */
export function formatLongDate(date: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toLocalDate(date));
  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const isValid =
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59;
  if (!isValid) {
    throw new Error(`Invalid local time "${time}".`);
  }
  return { hour, minute };
}

/** Formats a local HH:mm time with the requested 12/24-hour cycle. */
export function formatLocalTime(
  time: string,
  locale: string,
  hour12: boolean,
): string {
  const { hour, minute } = parseTime(time);
  const value = new Date(2000, 0, 1, hour, minute);
  const options: Intl.DateTimeFormatOptions = hour12
    ? { hour: '2-digit', minute: '2-digit', hour12: true }
    : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  return new Intl.DateTimeFormat(locale, options).format(value);
}

/** True when the range ends on the following day. */
export function isOvernight(range: HomeTimeRange): boolean {
  return range.end < range.start;
}

/** Formats a range and makes an overnight end explicit. */
export function formatTimeRange(
  range: HomeTimeRange,
  locale: string,
  hour12: boolean,
  overnightLabel: string,
): string {
  const start = formatLocalTime(range.start, locale, hour12);
  const end = formatLocalTime(range.end, locale, hour12);
  const suffix = isOvernight(range) ? ` · ${overnightLabel}` : '';
  return `${start} – ${end}${suffix}`;
}

/** Returns today/tomorrow labels or the long date for other days. */
export function relativeDayLabel(
  date: string,
  today: string,
  labels: RelativeDayLabels,
  locale: string,
): string {
  if (date === today) return labels.today;
  if (date === addDays(today, 1)) return labels.tomorrow;
  return formatLongDate(date, locale);
}

/** Sorts agenda items by date and then by start time. */
export function sortAgendaItems(
  items: readonly HomeAgendaItem[],
): HomeAgendaItem[] {
  return [...items].sort((left, right) => {
    const dateComparison = left.date.localeCompare(right.date);
    if (dateComparison !== 0) return dateComparison;
    return left.timeRange.start.localeCompare(right.timeRange.start);
  });
}
