export interface PayrollWindow {
  start: Date;
  endExclusive: Date;
}

export function getPayrollWindow(period: string, timeZone = "America/Sao_Paulo"): PayrollWindow {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Payroll period must use YYYY-MM");
  const [year, month] = period.split("-").map(Number);
  // The database persists UTC timestamps. This explicit UTC window avoids excluding the last day.
  // Tenant-specific timezone conversion belongs at the ingestion boundary.
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    endExclusive: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  };
}

export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime()) / 3_600_000;
}

export function nightHoursBetween(start: Date, end: Date, nightStartHour = 22, nightEndHour = 5): number {
  if (end <= start) return 0;
  let cursor = new Date(start);
  let totalMs = 0;
  while (cursor < end) {
    const dayStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
    const windowStart = new Date(dayStart);
    windowStart.setUTCHours(nightStartHour, 0, 0, 0);
    const windowEnd = new Date(dayStart);
    if (nightStartHour >= nightEndHour) windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);
    windowEnd.setUTCHours(nightEndHour, 0, 0, 0);
    const overlapStart = Math.max(start.getTime(), windowStart.getTime());
    const overlapEnd = Math.min(end.getTime(), windowEnd.getTime());
    if (overlapEnd > overlapStart) totalMs += overlapEnd - overlapStart;
    cursor = new Date(dayStart.getTime() + 86_400_000);
  }
  return totalMs / 3_600_000;
}

export function calculateProgressiveOvertimeHours(totalHours: number, regularLimit = 160): number {
  return Math.max(0, totalHours - regularLimit);
}
