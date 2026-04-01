const { format: formatDate, isValid } = require('date-fns');

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymdRegex.test(trimmed)) return null;
  const date = new Date(trimmed);
  if (isValid(date) && !isNaN(date.getTime())) return date.toISOString();
  return null;
}

// Simulated data loop (from importExpensesFromFile)
const excelRows = [
  { " Date ": 46082, " DESCRIPTION ": "Khule doodh", "Amount": 250, "Category": "Grocery" },
  { "date": "2026-03-01", "name": "Dahi", "amount": 70 }
];

console.log("--- Simulating Robust Import ---");
excelRows.forEach((row, i) => {
  // 1. Normalize headers
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    normalizedRow[key.trim().toLowerCase()] = row[key];
  });

  // 2. Extract
  const rawDate = normalizedRow.date;
  const rawDesc = normalizedRow.description || normalizedRow.name;
  const rawAmount = normalizedRow.amount;

  // 3. Handle Excel serials
  let parsedDateString = '';
  if (typeof rawDate === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const dayInMs = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + rawDate * dayInMs);
    parsedDateString = formatDate(date, 'yyyy-MM-dd');
  } else {
    parsedDateString = String(rawDate || '');
  }

  const normalizedDate = normalizeDate(parsedDateString);
  const amount = parseFloat(rawAmount);

  if (normalizedDate && rawDesc && !isNaN(amount)) {
    console.log(`Row ${i+1}: SUCCESS | Date: ${parsedDateString} | Desc: ${rawDesc} | Amt: ${amount}`);
  } else {
    console.log(`Row ${i+1}: FAILED  | RawDate: ${rawDate} -> String: ${parsedDateString} | Desc: ${rawDesc}`);
  }
});
