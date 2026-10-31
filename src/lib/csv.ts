/**
 * Fast, robust zero-dependency CSV parser and statistical analyzer for QUORAI.
 * Accurately extracts headers, rows, types, statistical aggregates, and summaries.
 */

export interface CsvColumnSummary {
  name: string;
  type: "number" | "date" | "string";
  count: number;
  distinctCount: number;
  min?: number;
  max?: number;
  sum?: number;
  avg?: number;
  topValues: Array<{ value: string; count: number }>;
}

export interface CsvAnalysis {
  filename: string;
  rowCount: number;
  colCount: number;
  headers: string[];
  columns: CsvColumnSummary[];
  sampleRows: Record<string, string>[];
  evidenceSnippet: string;
  markdownOverview: string;
  keyInsights: string[];
}

export function isCsvFile(name: string, mime?: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerMime = (mime ?? "").toLowerCase();
  return (
    lowerName.endsWith(".csv") ||
    lowerMime.includes("csv") ||
    lowerMime.includes("vnd.ms-excel")
  );
}

/** Detect delimiter (, or ; or \t) based on header line frequency */
function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) return ";";
  if (tabCount > commaCount && tabCount > semiCount) return "\t";
  return ",";
}

/** Robust RFC 4180 CSV parser handling quotes, escapes, commas and line breaks */
export function parseCsv(text: string): {
  headers: string[];
  rows: string[][];
  delimiter: string;
} {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) {
    return { headers: [], rows: [], delimiter: "," };
  }

  const firstLine = clean.split("\n")[0] || "";
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < clean.length) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i += 1;
          continue;
        }
      } else {
        currentField += char;
        i += 1;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i += 1;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
        i += 1;
        continue;
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i += 1;
        continue;
      } else {
        currentField += char;
        i += 1;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], delimiter };
  }

  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h, idx) => h.trim() || `Column_${idx + 1}`);
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows, delimiter };
}

function parseNumber(val: string): number | null {
  if (!val) return null;
  // Clean currency symbols, commas, percent signs
  const cleaned = val.replace(/[\$,€,£,¥,%]/g, "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function isDateString(val: string): boolean {
  if (!val || val.length < 4) return false;
  if (/^\d{4}[-/.]\d{1,2}([-/.]\d{1,2})?/.test(val)) return true;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(val)) return true;
  return false;
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  }
  return num.toFixed(2);
}

export function analyzeCsv(filename: string, text: string): CsvAnalysis {
  const { headers, rows } = parseCsv(text);
  const rowCount = rows.length;
  const colCount = headers.length;

  if (colCount === 0 || rowCount === 0) {
    return {
      filename,
      rowCount: 0,
      colCount: 0,
      headers: [],
      columns: [],
      sampleRows: [],
      evidenceSnippet: `Primary dataset “${filename}” (empty or invalid CSV format).`,
      markdownOverview: `*The uploaded file “${filename}” did not contain readable rows.*`,
      keyInsights: ["Dataset has no rows to analyze."],
    };
  }

  const columns: CsvColumnSummary[] = headers.map((header, colIndex) => {
    const rawValues = rows.map((r) => r[colIndex] ?? "").filter((v) => v.length > 0);
    const numericValues: number[] = [];
    let dateCount = 0;
    const freqMap = new Map<string, number>();

    for (const val of rawValues) {
      const num = parseNumber(val);
      if (num !== null) {
        numericValues.push(num);
      }
      if (isDateString(val)) {
        dateCount += 1;
      }
      freqMap.set(val, (freqMap.get(val) ?? 0) + 1);
    }

    const isNumeric = numericValues.length >= Math.max(1, rawValues.length * 0.7);
    const isDate = !isNumeric && dateCount >= Math.max(1, rawValues.length * 0.7);

    const type: "number" | "date" | "string" = isNumeric
      ? "number"
      : isDate
      ? "date"
      : "string";

    const topValues = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([value, count]) => ({ value, count }));

    if (type === "number" && numericValues.length > 0) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const sum = numericValues.reduce((acc, v) => acc + v, 0);
      const avg = sum / numericValues.length;

      return {
        name: header,
        type,
        count: rawValues.length,
        distinctCount: freqMap.size,
        min,
        max,
        sum,
        avg,
        topValues,
      };
    }

    return {
      name: header,
      type,
      count: rawValues.length,
      distinctCount: freqMap.size,
      topValues,
    };
  });

  // Sample rows as objects
  const sampleRows = rows.slice(0, 5).map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = r[i] ?? "";
    });
    return record;
  });

  // Extract key statistical insights
  const keyInsights: string[] = [];
  keyInsights.push(`Dataset comprises ${rowCount.toLocaleString()} records across ${colCount} attributes.`);

  const numericCols = columns.filter((c) => c.type === "number" && c.sum !== undefined);
  if (numericCols.length > 0) {
    for (const col of numericCols.slice(0, 3)) {
      keyInsights.push(
        `**${col.name}**: Total sum of ${formatNumber(col.sum!)}, with an average of ${formatNumber(col.avg!)} (min: ${formatNumber(col.min!)}, max: ${formatNumber(col.max!)}).`,
      );
    }
  }

  const categoricalCols = columns.filter((c) => c.type === "string" && c.topValues.length > 0);
  if (categoricalCols.length > 0) {
    const topCat = categoricalCols[0];
    const topVal = topCat.topValues[0];
    if (topVal) {
      keyInsights.push(
        `**${topCat.name}**: ${topCat.distinctCount} distinct categories; top value is “${topVal.value}” (${topVal.count} records, ${(
          (topVal.count / rowCount) *
          100
        ).toFixed(1)}% of dataset).`,
      );
    }
  }

  // Create evidence snippet
  let evidenceSnippet = `Primary uploaded dataset “${filename}”: ${rowCount.toLocaleString()} rows, ${colCount} columns [${headers.slice(0, 6).join(", ")}${headers.length > 6 ? ", …" : ""}].`;
  if (numericCols.length > 0) {
    evidenceSnippet += ` ${numericCols[0].name}: total ${formatNumber(numericCols[0].sum!)}, avg ${formatNumber(numericCols[0].avg!)}.`;
  } else if (categoricalCols.length > 0) {
    evidenceSnippet += ` Key category ${categoricalCols[0].name} (${categoricalCols[0].distinctCount} unique).`;
  }

  // Create structured markdown overview
  let markdownOverview = `### Primary Data Overview: \`${filename}\`\n\n`;
  markdownOverview += `| Attribute | Type | Non-Empty | Metrics / Distribution |\n`;
  markdownOverview += `| :--- | :--- | :--- | :--- |\n`;

  for (const col of columns) {
    let metricDetail = "";
    if (col.type === "number" && col.sum !== undefined) {
      metricDetail = `Sum: ${formatNumber(col.sum)} · Avg: ${formatNumber(col.avg!)} · Range: [${formatNumber(col.min!)} – ${formatNumber(col.max!)}]`;
    } else if (col.topValues.length > 0) {
      metricDetail = `${col.distinctCount} distinct · Top: ${col.topValues
        .slice(0, 2)
        .map((t) => `"${t.value}" (${t.count})`)
        .join(", ")}`;
    } else {
      metricDetail = `${col.distinctCount} distinct values`;
    }
    markdownOverview += `| **${col.name}** | \`${col.type}\` | ${col.count}/${rowCount} | ${metricDetail} |\n`;
  }

  return {
    filename,
    rowCount,
    colCount,
    headers,
    columns,
    sampleRows,
    evidenceSnippet,
    markdownOverview,
    keyInsights,
  };
}
