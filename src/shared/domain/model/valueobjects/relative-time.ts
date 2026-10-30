const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Hace 12 min", "Hace 3 h", "Ayer"... measured against `now`. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < MINUTE) return 'Hace un momento';
  if (diff < HOUR) return `Hace ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `Hace ${Math.floor(diff / HOUR)} h`;
  if (diff < 2 * DAY) return 'Ayer';
  return `Hace ${Math.floor(diff / DAY)} días`;
}

/** Local yyyy-mm-dd of a date, without the UTC shift of toISOString(). */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** "15 oct. 2026 · 9:30 a. m." */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

/** "Miércoles, 16 de octubre" */
export function formatLongDay(iso: string): string {
  const text = new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}
