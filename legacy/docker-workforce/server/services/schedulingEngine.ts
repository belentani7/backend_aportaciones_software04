import { and, eq, inArray } from "drizzle-orm";
import { shifts, employees } from "../../drizzle/schema";
import { getDb } from "../db";
import * as ComplianceEngine from "./complianceEngine";
import crypto from "crypto";
import { assertThreeNodeQuorum, verifyThreeNodeQuorum, type CriticalOperation, type QuorumConfirmation, type QuorumNodeIdentity } from "./quorumService";

interface ScheduleRequest {
  tenantId: number;
  weekStart: Date;
  shiftsPerDay: number;
  hoursPerShift: number;
}

interface ScheduleResult {
  status: "success" | "partial" | "failed";
  shiftsCreated: number;
  violations: string[];
  jobId: string;
}

export class SchedulingEngine {
  private complianceEngine: typeof ComplianceEngine;

  constructor() {
    this.complianceEngine = ComplianceEngine;
  }

  async generateWeeklySchedule(request: ScheduleRequest): Promise<ScheduleResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const jobId = crypto.randomUUID();
    const violations: string[] = [];
    let shiftsCreated = 0;

    try {
      const employeeList = await db
        .select()
        .from(employees)
        .where(eq(employees.tenantId, request.tenantId));

      if (employeeList.length === 0) {
        return {
          status: "failed",
          shiftsCreated: 0,
          violations: ["No employees found for tenant"],
          jobId,
        };
      }

      const numDays = 7;
      const shiftTypes = ["morning", "afternoon", "night"];

      for (let day = 0; day < numDays; day++) {
        for (let shiftIdx = 0; shiftIdx < request.shiftsPerDay; shiftIdx++) {
          const shiftDate = new Date(request.weekStart);
          shiftDate.setDate(shiftDate.getDate() + day);

          const { startTime, endTime } = this.getShiftTimes(shiftDate, shiftIdx);

          for (const emp of employeeList) {
            const isValid = await this.complianceEngine.validateShift(
              emp.tenantId,
              emp.id,
              startTime,
              endTime
            );

            if (isValid) {
              await db.insert(shifts).values({
                tenantId: request.tenantId,
                employeeId: emp.id,
                startTime,
                endTime,
                shiftType: shiftTypes[shiftIdx % shiftTypes.length],
                status: "scheduled",
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              shiftsCreated++;
              break;
            } else {
              violations.push(
                `Employee ${emp.id} cannot work ${shiftTypes[shiftIdx % shiftTypes.length]} on ${shiftDate.toISOString()}`
              );
            }
          }
        }
      }

      return {
        status: shiftsCreated > 0 ? "success" : "failed",
        shiftsCreated,
        violations,
        jobId,
      };
    } catch (error) {
      console.error("[SchedulingEngine] Error:", error);
      return {
        status: "failed",
        shiftsCreated,
        violations: [`Error: ${error instanceof Error ? error.message : "Unknown"}`],
        jobId,
      };
    }
  }

  private getShiftTimes(date: Date, shiftIdx: number): { startTime: Date; endTime: Date } {
    const start = new Date(date);
    const end = new Date(date);

    if (shiftIdx === 0) {
      start.setHours(6, 0, 0);
      end.setHours(14, 0, 0);
    } else if (shiftIdx === 1) {
      start.setHours(14, 0, 0);
      end.setHours(22, 0, 0);
    } else {
      start.setHours(22, 0, 0);
      end.setDate(end.getDate() + 1);
      end.setHours(6, 0, 0);
    }

    return { startTime: start, endTime: end };
  }

  async optimizeSchedule(tenantId: number, weekStart: Date): Promise<ScheduleResult> {
    return this.generateWeeklySchedule({
      tenantId,
      weekStart,
      shiftsPerDay: 3,
      hoursPerShift: 8,
    });
  }
}

export const schedulingEngine = new SchedulingEngine();
export interface GenerateScheduleInput {
  tenantId: number;
  startDate: Date;
  endDate: Date;
  employeeIds: number[];
  market: string;
}

export async function generateSchedule(input: GenerateScheduleInput): Promise<ScheduleResult> {
  return schedulingEngine.generateWeeklySchedule({
    tenantId: input.tenantId,
    weekStart: input.startDate,
    shiftsPerDay: 3,
    hoursPerShift: 8,
  });
}

export async function publishSchedule(
  tenantId: number,
  shiftsToPublish: Array<{ id: number } | number>,
  quorum: { operation: CriticalOperation; confirmations: QuorumConfirmation[]; identities: QuorumNodeIdentity[] },
): Promise<{ success: true; published: true; count: number; quorum: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shiftIds = shiftsToPublish
    .map((shift) => typeof shift === "number" ? shift : shift.id)
    .filter((id): id is number => Number.isInteger(id));

  if (quorum.operation.tenantId !== tenantId || quorum.operation.operationType !== "publish_schedule") {
    throw new Error("Critical operation metadata does not match the requested publication");
  }
  const expectedPayload = JSON.stringify({ shiftIds, tenantId });
  const receivedPayload = JSON.stringify({
    shiftIds: Array.isArray(quorum.operation.payload.shiftIds) ? quorum.operation.payload.shiftIds : [],
    tenantId: quorum.operation.payload.tenantId,
  });
  if (expectedPayload !== receivedPayload) throw new Error("Critical operation payload mismatch");

  const quorumResult = verifyThreeNodeQuorum(quorum.operation, quorum.confirmations, quorum.identities, 2);
  assertThreeNodeQuorum(quorumResult);

  if (shiftIds.length > 0) {
    await db
      .update(shifts)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(shifts.tenantId, tenantId), inArray(shifts.id, shiftIds)));
  }

  return { success: true, published: true, count: shiftIds.length, quorum: quorumResult.validConfirmations };
}
