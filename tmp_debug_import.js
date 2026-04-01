const XLSX = require('xlsx');
const { format: formatDate, parse: parseDate, isValid } = require('date-fns');

function normalizeDate(dateStr) {
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

// User's provided data (simulating a CSV/Excel parse result)
const rows = [
  { date: "2026-03-01", description: "Khule doodh", amount: 250, category: "Grocery" },
  { date: "2026-03-01", description: "Dahi", amount: 70, category: "Food" },
  { date: "2026-03-01", description: "M-tag", amount: 250, category: "Transport" },
  { date: "2026-03-01", description: "Biryani", amount: 200, category: "Food" },
  { date: "2026-03-02", description: "Dahi", amount: 70, category: "Food" },
  { date: "2026-03-02", description: "Biryani", amount: 400, category: "Food" },
  { date: "2026-03-02", description: "Shawarma", amount: 200, category: "Food" }
];

let imported = 0;
let skipped = 0;

console.log("--- Simulating Import ---");
rows.forEach((row, index) => {
  const rawDate = row.date;
  const rawDesc = row.description;
  const rawAmount = row.amount;
  const rawCategory = row.category;

  let parsedDateString = String(rawDate || '');
  const normalizedDate = normalizeDate(parsedDateString);
  const amount = parseFloat(rawAmount);

  if (!normalizedDate || !rawDesc || isNaN(amount)) {
    console.log(`Row ${index + 1}: FAILED (Date: ${normalizedDate}, Desc: ${rawDesc}, Amt: ${amount})`);
    skipped++;
  } else {
    console.log(`Row ${index + 1}: SUCCESS (${rawDesc})`);
    imported++;
  }
});

console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
