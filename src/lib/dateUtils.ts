import { startOfDay, endOfMonth, differenceInDays, format as formatDate, parse as parseDate, isValid } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
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
 * Normalizes a date string into an ISO string.
 * STRICT: Only accepts YYYY-MM-DD format to ensure consistency.
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  
  // Strict regex check for YYYY-MM-DD
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymdRegex.test(trimmed)) {
    return null;
  }

  const date = new Date(trimmed);
  if (isValid(date) && !isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}

/**
 * Exports expenses to an XLSX file and triggers the native share dialog.
 */
export async function exportExpensesToXLSX(expenses: Expense[]): Promise<boolean> {
  if (expenses.length === 0) return false;

  const data = expenses.map(e => ({
    date: formatDate(new Date(e.date), 'yyyy-MM-dd'),
    description: e.name,
    amount: e.amount,
    category: e.category
  }));

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `ledgr_export_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Expenses',
      UTI: 'org.openxmlformats.spreadsheetml.sheet'
    });
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}

/**
 * Opens a file picker and imports expenses from a CSV or XLSX file.
 * Returns the number of successfully imported and skipped rows.
 */
export async function importExpensesFromFile(existingExpenses: Expense[]): Promise<{ imported: number, skipped: number, expenses: Expense[] } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      copyToCacheDirectory: true
    });

    if (result.canceled) return null;

    const fileUri = result.assets[0].uri;
    const isXlsx = fileUri.toLowerCase().endsWith('.xlsx');
    
    // Read based on type
    const encoding = isXlsx ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8;
    const content = await FileSystem.readAsStringAsync(fileUri, { encoding });
    
    const workbook = XLSX.read(content, { type: isXlsx ? 'base64' : 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(firstSheet) as any[];

    let imported = 0;
    let skipped = 0;
    const newExpenses: Expense[] = [];

    for (const row of rows) {
      // 1. Normalize headers (trim and lowercase)
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      });

      // 2. Extract fields using normalized keys
      const rawDate = normalizedRow.date || normalizedRow.Date;
      const rawDesc = normalizedRow.description || normalizedRow.name;
      const rawAmount = normalizedRow.amount;
      const rawCategory = normalizedRow.category || 'Other';

      // 3. Handle Excel numeric dates vs strings
      let parsedDateString = '';
      if (typeof rawDate === 'number') {
        // Excel base date is Dec 30, 1899
        const excelEpoch = new Date(1899, 11, 30);
        const dayInMs = 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + rawDate * dayInMs);
        parsedDateString = formatDate(date, 'yyyy-MM-dd');
      } else {
        parsedDateString = String(rawDate || '');
      }

      const normalizedDate = normalizeDate(parsedDateString);
      const amount = parseFloat(rawAmount);

      if (!normalizedDate || !rawDesc || isNaN(amount)) {
        skipped++;
        continue;
      }

      // Check for duplicates in existing data
      const isDuplicate = existingExpenses.some(e => 
        formatDate(new Date(e.date), 'yyyy-MM-dd') === formatDate(new Date(normalizedDate), 'yyyy-MM-dd') &&
        e.name.trim().toLowerCase() === String(rawDesc).trim().toLowerCase() &&
        e.amount === amount
      );

      if (isDuplicate) {
        skipped++;
        continue;
      }

      newExpenses.push({
        id: Math.random().toString(36).substring(2, 11),
        date: normalizedDate,
        name: String(rawDesc).trim(),
        amount: amount,
        category: String(rawCategory) as ExpenseCategory
      });
      imported++;
    }

    return { imported, skipped, expenses: newExpenses };
  } catch (error) {
    console.error('Import failed:', error);
    return null;
  }
}
