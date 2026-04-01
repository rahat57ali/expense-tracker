import { parse as parseDate, isValid } from 'date-fns';

function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim().replace(/[,]/g, ''); 
  
  const isoDate = new Date(trimmed);
  if (isValid(isoDate) && !isNaN(isoDate.getTime()) && trimmed.includes('-')) {
    return isoDate.toISOString();
  }

  const patterns = [
    'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy-MM-dd',
    'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd',
    'dd.MM.yyyy', 'MM.dd.yyyy', 'yyyy.MM.dd',
    'dd MMM yyyy', 'MMM dd yyyy',
    'dd MMMM yyyy', 'MMMM dd yyyy',
    'dd/MM/yy', 'MM/dd/yy', 'yy-MM-dd'
  ];

  const now = new Date();
  for (const pattern of patterns) {
    const parsed = parseDate(trimmed, pattern, now);
    if (isValid(parsed) && !isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const spaceNormalized = trimmed.replace(/\s+/g, '-');
  const fallbackParsed = new Date(spaceNormalized);
  if (isValid(fallbackParsed) && !isNaN(fallbackParsed.getTime())) {
    return fallbackParsed.toISOString();
  }

  return null;
}

const testCases = [
  "2026-03-31",
  "31/03/2026",
  "03/31/2026",
  "31-03-2026",
  "03-31-2026",
  "2026/03/31",
  "31.03.2026",
  "31 Mar 2026",
  "March 31, 2026",
  "31 March 2026",
  "Mar 31 2026",
  "31 03 2026"
];

console.log("--- Date Normalization Tests ---");
testCases.forEach(tc => {
  const result = normalizeDate(tc);
  console.log(`${tc.padEnd(20)} => ${result || "FAILED"}`);
});
