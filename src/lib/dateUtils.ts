import { startOfDay, endOfMonth, differenceInDays, format as formatDate, parse as parseDate, isValid } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { Expense, ExpenseCategory } from './store';

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

/**
 * Normalizes various date formats into an ISO string.
 * Supports patterns like YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY.
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  
  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (isValid(isoDate) && !isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }

  // Common patterns to try
  const patterns = ['dd-MM-yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd', 'dd/MM/yyyy'];
  for (const pattern of patterns) {
    const parsed = parseDate(trimmed, pattern, new Date());
    if (isValid(parsed)) return parsed.toISOString();
  }

  return null;
}

/**
 * Exports expenses to a CSV file and triggers the native share dialog.
 */
export async function exportExpensesToCSV(expenses: Expense[]): Promise<boolean> {
  if (expenses.length === 0) return false;

  const data = expenses.map(e => ({
    date: formatDate(new Date(e.date), 'yyyy-MM-dd'),
    description: e.name,
    amount: e.amount,
    category: e.category
  }));

  const csv = Papa.unparse(data);
  const fileName = `ledgr_export_${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Expenses',
      UTI: 'public.comma-separated-values-text'
    });
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}

/**
 * Opens a file picker and imports expenses from a CSV file.
 * Returns the number of successfully imported and skipped rows.
 */
export async function importExpensesFromCSV(existingExpenses: Expense[]): Promise<{ imported: number, skipped: number, expenses: Expense[] } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const csvContent = await FileSystem.readAsStringAsync(fileUri);
    
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
       console.warn('CSV Parse errors:', parsed.errors);
    }

    const rows = parsed.data as any[];
    let imported = 0;
    let skipped = 0;
    const newExpenses: Expense[] = [];

    for (const row of rows) {
      // Required fields: date, description (or name), amount
      const rawDate = row.date || row.Date;
      const rawDesc = row.description || row.Description || row.name || row.Name;
      const rawAmount = row.amount || row.Amount;
      const rawCategory = row.category || row.Category || 'Other';

      const normalizedDate = normalizeDate(rawDate);
      const amount = parseFloat(rawAmount);

      if (!normalizedDate || !rawDesc || isNaN(amount)) {
        skipped++;
        continue;
      }

      // Check for duplicates in existing data
      const isDuplicate = existingExpenses.some(e => 
        formatDate(new Date(e.date), 'yyyy-MM-dd') === formatDate(new Date(normalizedDate), 'yyyy-MM-dd') &&
        e.name.trim().toLowerCase() === rawDesc.trim().toLowerCase() &&
        e.amount === amount
      );

      if (isDuplicate) {
        skipped++;
        continue;
      }

      newExpenses.push({
        id: Math.random().toString(36).substring(2, 11),
        date: normalizedDate,
        name: rawDesc.trim(),
        amount: amount,
        category: rawCategory as ExpenseCategory
      });
      imported++;
    }

    return { imported, skipped, expenses: newExpenses } as any;
  } catch (error) {
    console.error('Import failed:', error);
    return null;
  }
}
