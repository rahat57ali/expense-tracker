import { startOfDay, endOfMonth, differenceInDays } from 'date-fns';

/**
 * Calculates the number of days remaining in the current month,
 * including today.
 */
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const today = startOfDay(now);
  const lastDayOfMonth = endOfMonth(now);
  
  // differenceInDays(end, start) returns full days between dates.
  // Adding 1 to include the current day in the count.
  return differenceInDays(lastDayOfMonth, today) + 1;
}

/**
 * Calculates the total number of days in the current month.
 */
export function getDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

/**
 * Checks if a given date string is today.
 */
export function isToday(dateStr: string): boolean {
  const todayDate = new Date().toISOString().split('T')[0];
  return dateStr.split('T')[0] === todayDate;
}
