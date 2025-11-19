export type DateOnly = {
  year: number;
  month: number;
  day: number;
};

export function parseDateOnly(
  dateString: string | null | undefined
): Date | DateOnly | null {
  if (!dateString) return null;

  // Caso seja timestamp ISO ("2025-11-14T00:00:00Z")
  if (dateString.includes("T")) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Data pura "YYYY-MM-DD"
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return null;

  return { year, month, day };
}

export function getYear(d: Date | DateOnly): number {
  return d instanceof Date ? d.getFullYear() : d.year;
}

export function getMonth(d: Date | DateOnly): number {
  return d instanceof Date ? d.getMonth() + 1 : d.month;
}

export function getDay(d: Date | DateOnly): number {
  return d instanceof Date ? d.getDate() : d.day;
}

export function formatDate(dateString: string | null | undefined): string {
  const d = parseDateOnly(dateString);
  if (!d) return "";

  if (d instanceof Date) {
    // Para timestamps ISO vindos do banco
    return d.toLocaleDateString("pt-BR");
  }

  // Para datas puras no formato YYYY-MM-DD
  const { day, month, year } = d;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}
