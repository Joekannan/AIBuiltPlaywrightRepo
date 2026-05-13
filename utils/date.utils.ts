/**
 * Returns a UTC timestamp string safe for use in file names and test IDs.
 * Example: "2026-05-08T06-00-00Z"
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1) + 'Z';
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Returns a new Date shifted by the given number of days from today.
 * Negative values go into the past.
 */
export function addDays(days: number, from: Date = new Date()): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns today's date as YYYY-MM-DD.
 */
export function today(): string {
  return formatDate(new Date());
}
