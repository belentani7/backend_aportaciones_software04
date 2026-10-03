import { eq, and, gte, lte } from "drizzle-orm";
import { rtaEvents, shifts } from "../../drizzle/schema";
import { getDb } from "../db";
import { createAuditLog } from "./auditService";

export interface RTAEvent {
  tenantId: number;
  employeeId: number;
  shiftId: number;
  eventType: string;
  eventTime: Date;
  location?: string;
  deviceId?: string;
}

export async function recordRTAEvent(event: RTAEvent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(rtaEvents).values({
    tenantId: event.tenantId,
    employeeId: event.employeeId,
    shiftId: event.shiftId,
    eventType: event.eventType,
    eventTime: event.eventTime,
  });

  await createAuditLog({
    tenantId: event.tenantId,
    userId: event.employeeId,
    action: `rta_${event.eventType}`,
    resourceType: "shift",
    resourceId: String(event.shiftId),
    afterState: event,
  });
}

export async function getShiftAdherence(
  tenantId: number,
  shiftId: number
): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
  if (shift.length === 0) throw new Error("Shift not found");

  const events = await db
    .select()
    .from(rtaEvents)
    .where(and(eq(rtaEvents.tenantId, tenantId), eq(rtaEvents.shiftId, shiftId)))
    .orderBy(rtaEvents.eventTime);

  const checkIn = events.find((e) => e.eventType === "check_in");
  const checkOut = events.find((e) => e.eventType === "check_out");
  const breakStart = events.find((e) => e.eventType === "break_start");
  const breakEnd = events.find((e) => e.eventType === "break_end");

  const expectedStart = shift[0].startTime;
  const expectedEnd = shift[0].endTime;

  let adherence = 100;
  const issues: string[] = [];

  if (!checkIn) {
    adherence -= 50;
    issues.push("No check-in recorded");
  } else {
    const checkInTime = new Date(checkIn.eventTime).getTime();
    const expectedTime = expectedStart.getTime();
    const diffMinutes = (checkInTime - expectedTime) / (1000 * 60);

    if (diffMinutes > 15) {
      adherence -= Math.min(30, diffMinutes / 2);
      issues.push(`Late check-in: ${Math.round(diffMinutes)} minutes`);
    }
  }

  if (!checkOut) {
    adherence -= 50;
    issues.push("No check-out recorded");
  } else {
    const checkOutTime = new Date(checkOut.eventTime).getTime();
    const expectedTime = expectedEnd.getTime();
    const diffMinutes = (expectedTime - checkOutTime) / (1000 * 60);

    if (diffMinutes > 15) {
      adherence -= Math.min(30, diffMinutes / 2);
      issues.push(`Early check-out: ${Math.round(diffMinutes)} minutes`);
    }
  }

  return {
    shiftId,
    adherenceScore: Math.max(0, adherence),
    checkIn: checkIn ? new Date(checkIn.eventTime) : null,
    checkOut: checkOut ? new Date(checkOut.eventTime) : null,
    breakStart: breakStart ? new Date(breakStart.eventTime) : null,
    breakEnd: breakEnd ? new Date(breakEnd.eventTime) : null,
    issues,
    compliant: adherence >= 90,
  };
}

export async function getEmployeeRTAStats(
  tenantId: number,
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const events = await db
    .select()
    .from(rtaEvents)
    .where(
      and(
        eq(rtaEvents.tenantId, tenantId),
        eq(rtaEvents.employeeId, employeeId),
        gte(rtaEvents.eventTime, startDate),
        lte(rtaEvents.eventTime, endDate)
      )
    );

  const checkIns = events.filter((e) => e.eventType === "check_in").length;
  const checkOuts = events.filter((e) => e.eventType === "check_out").length;
  const avgAdherence = checkIns > 0 ? (checkOuts / checkIns) * 100 : 0;

  return {
    employeeId,
    period: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
    totalEvents: events.length,
    checkIns,
    checkOuts,
    adherenceRate: Math.round(avgAdherence),
    compliant: avgAdherence >= 95,
  };
}
