/**
 * Parse a single CSV line, handling double-quote escaping.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Remove UTF-8 BOM from the beginning of CSV text if present.
 */
export function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Parse CSV text into rows (array of string arrays).
 * Strips BOM, filters empty lines.
 */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const clean = stripBOM(text);
  const lines = clean.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  return { headers, rows };
}
