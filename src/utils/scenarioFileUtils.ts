import { ROASScenario, ROASScenarioData } from '@/hooks/useROASScenarios';

export type ScenarioImportItem = { name: string; data: ROASScenarioData };

export const CSV_HEADERS = [
  'Name',
  'Ad Spend',
  'Revenue',
  'Target Revenue',
  'Expected ROAS',
  'AOV',
  'Profit Margin',
  'Target Profit',
  'Monthly Budget',
  'Avg CPC',
  'Conversion Rate',
  'Avg Order Value',
  'Created At',
  'Updated At',
] as const;

// ── helpers ──

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string, type: string) {
  downloadBlob(new Blob([content], { type }), filename);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function scenarioToRow(s: ROASScenario): string[] {
  return [
    s.name,
    s.data.roasAdSpend,
    s.data.roasRevenue,
    s.data.targetRevenue,
    s.data.expectedROAS,
    s.data.aov,
    s.data.profitMargin,
    s.data.targetProfit,
    s.data.monthlyBudget,
    s.data.avgCPC,
    s.data.conversionRate,
    s.data.avgOrderValue,
    s.createdAt,
    s.updatedAt,
  ];
}

function columnsToScenarioData(cols: string[]): ROASScenarioData {
  return {
    roasAdSpend: cols[1] || '',
    roasRevenue: cols[2] || '',
    targetRevenue: cols[3] || '',
    expectedROAS: cols[4] || '',
    aov: cols[5] || '',
    profitMargin: cols[6] || '',
    targetProfit: cols[7] || '20',
    monthlyBudget: cols[8] || '',
    avgCPC: cols[9] || '',
    conversionRate: cols[10] || '',
    avgOrderValue: cols[11] || '',
  };
}

// ── exports ──

export function exportToJSON(scenarios: ROASScenario[]) {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scenarios: scenarios.map(({ id, ...rest }) => rest),
  };
  const date = new Date().toISOString().slice(0, 10);
  downloadText(JSON.stringify(exportData, null, 2), `roas-scenarios-${date}.json`, 'application/json');
}

export function exportToCSV(scenarios: ROASScenario[]) {
  const rows = scenarios.map((s) => scenarioToRow(s).map(escapeCsv));
  const csv = [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadText(csv, `roas-scenarios-${date}.csv`, 'text/csv');
}

export async function exportToExcel(scenarios: ROASScenario[]) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('ROAS Scenarios');

  worksheet.columns = CSV_HEADERS.map((header) => ({ header, key: header, width: 18 }));

  const headerRow = worksheet.getRow(1);
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  scenarios.forEach((s) => worksheet.addRow(scenarioToRow(s)));

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `roas-scenarios-${date}.xlsx`,
  );
}

// ── imports ──

export function importFromJSON(text: string): ScenarioImportItem[] {
  const parsed = JSON.parse(text);
  const list = parsed.scenarios || (Array.isArray(parsed) ? parsed : [parsed]);
  const items: ScenarioImportItem[] = [];
  for (const s of list) {
    if (s.data && typeof s.data === 'object') {
      items.push({ name: s.name || 'Imported Scenario', data: s.data });
    }
  }
  return items;
}

export function importFromCSV(text: string): ScenarioImportItem[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const items: ScenarioImportItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 12) continue;
    items.push({ name: cols[0] || `Imported ${i}`, data: columnsToScenarioData(cols) });
  }
  return items;
}

export async function importFromExcel(file: File): Promise<ScenarioImportItem[]> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) return [];

  const items: ScenarioImportItem[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cell = (idx: number) => String(row.getCell(idx).value ?? '').trim();
    if (!cell(1) && !cell(2)) return;
    const cols = Array.from({ length: 12 }, (_, i) => cell(i + 1));
    items.push({ name: cols[0] || `Imported ${rowNumber - 1}`, data: columnsToScenarioData(cols) });
  });
  return items;
}
