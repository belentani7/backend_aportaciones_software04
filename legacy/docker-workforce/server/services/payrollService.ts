import { eq, and, gte, lt } from "drizzle-orm";
import { shifts, payrolls, payrollAdjustments, employees, absences } from "../../drizzle/schema";
import { getDb } from "../db";
import { createDomainEvent, createAuditLog } from "./auditService";
import { calculateProgressiveOvertimeHours, getPayrollWindow, hoursBetween, nightHoursBetween } from "./payrollMath";

export interface PayrollCalculation {
  employeeId: number;
  period: string;
  baseSalary: number;
  hoursWorked: number;
  nightHours: number;
  overtimeHours: number;
  nightBonus: number;
  overtimeBonus: number;
  holidayBonus: number;
  nutriPass: number;
  absenceDays: number;
  gross: number;
  net: number;
}

export async function calculatePayroll(
  tenantId: number,
  employeeId: number,
  period: string
): Promise<PayrollCalculation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { start: startDate, endExclusive: endDate } = getPayrollWindow(period);

  const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (emp.length === 0) throw new Error("Employee not found");

  const employee = emp[0];
  const baseSalary = parseFloat((employee.baseSalary as unknown as string) || "0");

  const shiftsData = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.employeeId, employeeId),
        eq(shifts.tenantId, tenantId),
        gte(shifts.startTime, startDate),
        lt(shifts.startTime, endDate),
        eq(shifts.status, "completed")
      )
    );

  let hoursWorked = 0;
  let nightHours = 0;
  let overtimeHours = 0;

  for (const shift of shiftsData) {
    const hours = hoursBetween(shift.startTime, shift.endTime);
    hoursWorked += hours;
    nightHours += nightHoursBetween(shift.startTime, shift.endTime, 22, 5);
  }

  const absenceData = await db
    .select()
    .from(absences)
    .where(
      and(
        eq(absences.employeeId, employeeId),
        eq(absences.tenantId, tenantId),
        lt(absences.startDate, endDate),
        gte(absences.endDate, startDate),
        eq(absences.status, "approved")
      )
    );

  let absenceDays = 0;
  for (const absence of absenceData) {
    const days = Math.ceil(
      (absence.endDate.getTime() - absence.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    absenceDays += days;
  }

  overtimeHours = calculateProgressiveOvertimeHours(hoursWorked, 160);
  const nightBonus = nightHours * (baseSalary / 160) * 0.25;
  const overtimeBonus = overtimeHours * (baseSalary / 160) * 1.75;
  const holidayBonus = 0;
  const nutriPass = 0;

  const gross = baseSalary + nightBonus + overtimeBonus;
  const net = gross;

  const result: PayrollCalculation = {
    employeeId,
    period,
    baseSalary,
    hoursWorked,
    nightHours,
    overtimeHours,
    nightBonus,
    overtimeBonus,
    holidayBonus,
    nutriPass,
    absenceDays,
    gross,
    net,
  };

  // Taxes, FGTS, INSS, IRRF, benefits and collective-agreement rules are intentionally not hardcoded.
  // This output is a pre-payroll estimate until a BR fiscal configuration is supplied by the tenant.

  return result;
}

export async function savePayroll(
  tenantId: number,
  calc: PayrollCalculation,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payrolls).values({
    tenantId,
    employeeId: calc.employeeId,
    period: calc.period,
    baseSalary: calc.baseSalary.toString(),
    hoursWorked: calc.hoursWorked.toString(),
    nightHours: calc.nightHours.toString(),
    overtimeHours: calc.overtimeHours.toString(),
    nightBonus: calc.nightBonus.toString(),
    overtimeBonus: calc.overtimeBonus.toString(),
    holidayBonus: calc.holidayBonus.toString(),
    nutriPass: calc.nutriPass.toString(),
    absenceDays: calc.absenceDays,
    gross: calc.gross.toString(),
    net: calc.net.toString(),
    status: "calculated",
    createdBy: userId,
  });

  await createDomainEvent({
    tenantId,
    aggregateType: "payroll",
    aggregateId: `payroll_${calc.employeeId}_${calc.period}`,
    eventType: "PayrollCalculated",
    eventData: calc,
  });

  return result[0].insertId as number;
}

export async function addPayrollAdjustment(
  tenantId: number,
  payrollId: number,
  adjustmentType: string,
  amount: number,
  reason: string,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(payrollAdjustments).values({
    tenantId,
    payrollId,
    adjustmentType,
    amount: amount.toString(),
    reason,
    approvedBy: userId,
  });

  await createAuditLog({
    tenantId,
    userId,
    action: "payroll_adjustment_added",
    resourceType: "payroll",
    resourceId: String(payrollId),
    afterState: { adjustmentType, amount, reason },
  });
}
