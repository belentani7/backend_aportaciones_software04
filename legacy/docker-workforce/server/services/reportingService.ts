import { eq, and, gte, lte } from "drizzle-orm";
import { shifts, payrolls, absences, complianceViolations } from "../../drizzle/schema";
import { getDb } from "../db";

export async function generateComplianceReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const violations = await db
    .select()
    .from(complianceViolations)
    .where(
      and(
        eq(complianceViolations.tenantId, tenantId),
        gte(complianceViolations.createdAt, startDate),
        lte(complianceViolations.createdAt, endDate)
      )
    );

  const headers = ["ID", "Employee ID", "Rule ID", "Severity", "Description", "Penalty EUR"];
  const rows = violations.map((v) => [
    v.id,
    v.employeeId,
    v.ruleId,
    v.severity,
    v.description,
    v.penaltyEur,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

export async function generatePayrollReport(
  tenantId: number,
  period: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const payrollData = await db
    .select()
    .from(payrolls)
    .where(and(eq(payrolls.tenantId, tenantId), eq(payrolls.period, period)));

  const headers = [
    "Employee ID",
    "Period",
    "Base Salary",
    "Hours Worked",
    "Night Hours",
    "Overtime Hours",
    "Gross",
    "Net",
    "Status",
  ];
  const rows = payrollData.map((p) => [
    p.employeeId,
    p.period,
    p.baseSalary,
    p.hoursWorked,
    p.nightHours,
    p.overtimeHours,
    p.gross,
    p.net,
    p.status,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

export async function generateScheduleReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shiftsData = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.tenantId, tenantId),
        gte(shifts.startTime, startDate),
        lte(shifts.startTime, endDate)
      )
    );

  const headers = ["Employee ID", "Start Time", "End Time", "Shift Type", "Status"];
  const rows = shiftsData.map((s) => [
    s.employeeId,
    s.startTime.toISOString(),
    s.endTime.toISOString(),
    s.shiftType,
    s.status,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

export async function generateAbsenceReport(
  tenantId: number,
  year: number
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const absenceData = await db
    .select()
    .from(absences)
    .where(
      and(
        eq(absences.tenantId, tenantId),
        gte(absences.startDate, startDate),
        lte(absences.endDate, endDate)
      )
    );

  const headers = ["Employee ID", "Type", "Start Date", "End Date", "Duration Days", "Status"];
  const rows = absenceData.map((a) => [
    a.employeeId,
    a.absenceType,
    a.startDate.toISOString().split("T")[0],
    a.endDate.toISOString().split("T")[0],
    a.durationDays,
    a.status,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}
