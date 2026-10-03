import { eq, and, gte, lte } from "drizzle-orm";
import { absences, employees } from "../../drizzle/schema";
import { getDb } from "../db";
import { createDomainEvent, createAuditLog } from "./auditService";

export const ABSENCE_TYPES = {
  VACATION: { code: "VAC", paid: true, daysAllowance: 30 },
  SICK_LEAVE: { code: "SIC", paid: true, daysAllowance: 30 },
  MATERNITY: { code: "MAT", paid: true, daysAllowance: 112 },
  PATERNITY: { code: "PAT", paid: true, daysAllowance: 15 },
  UNPAID_LEAVE: { code: "UNP", paid: false, daysAllowance: 0 },
  PERSONAL: { code: "PER", paid: false, daysAllowance: 3 },
  COMPASSIONATE: { code: "COM", paid: true, daysAllowance: 3 },
  TRAINING: { code: "TRN", paid: true, daysAllowance: 0 },
  JURY_DUTY: { code: "JUR", paid: true, daysAllowance: 0 },
  STRIKE: { code: "STR", paid: false, daysAllowance: 0 },
  ACCIDENT: { code: "ACC", paid: true, daysAllowance: 0 },
  DISABILITY: { code: "DIS", paid: true, daysAllowance: 0 },
  EXAM: { code: "EXM", paid: false, daysAllowance: 5 },
  MEDICAL: { code: "MED", paid: true, daysAllowance: 0 },
  SUSPENSION: { code: "SUS", paid: false, daysAllowance: 0 },
  HOLIDAY: { code: "HOL", paid: true, daysAllowance: 0 },
};

export async function requestAbsence(
  tenantId: number,
  employeeId: number,
  absenceType: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const typeConfig = ABSENCE_TYPES[absenceType as keyof typeof ABSENCE_TYPES];

  const result = await db.insert(absences).values({
    tenantId,
    employeeId,
    absenceType,
    startDate,
    endDate,
    durationDays: durationDays.toString(),
    isPaid: typeConfig?.paid || false,
    status: "pending_approval",
    createdBy: userId,
  });

  await createDomainEvent({
    tenantId,
    aggregateType: "absence",
    aggregateId: `absence_${employeeId}_${startDate.getTime()}`,
    eventType: "AbsenceRequested",
    eventData: {
      employeeId,
      absenceType,
      startDate,
      endDate,
      durationDays,
      reason,
    },
  });

  return result[0].insertId as number;
}

export async function approveAbsence(
  tenantId: number,
  absenceId: number,
  userId: number,
  notes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(absences)
    .set({
      status: "approved",
      approvedBy: userId,
      approvalNotes: notes,
    })
    .where(eq(absences.id, absenceId));

  await createAuditLog({
    tenantId,
    userId,
    action: "absence_approved",
    resourceType: "absence",
    resourceId: String(absenceId),
    afterState: { status: "approved", notes },
  });
}

export async function rejectAbsence(
  tenantId: number,
  absenceId: number,
  userId: number,
  reason: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(absences)
    .set({
      status: "rejected",
      approvedBy: userId,
      approvalNotes: reason,
    })
    .where(eq(absences.id, absenceId));

  await createAuditLog({
    tenantId,
    userId,
    action: "absence_rejected",
    resourceType: "absence",
    resourceId: String(absenceId),
    afterState: { status: "rejected", reason },
  });
}

export async function getEmployeeAbsences(
  tenantId: number,
  employeeId: number,
  year: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return await db
    .select()
    .from(absences)
    .where(
      and(
        eq(absences.tenantId, tenantId),
        eq(absences.employeeId, employeeId),
        gte(absences.startDate, startDate),
        lte(absences.endDate, endDate)
      )
    );
}
