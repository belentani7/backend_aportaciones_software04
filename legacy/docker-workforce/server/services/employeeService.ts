import { eq, and } from "drizzle-orm";
import { employees } from "../../drizzle/schema";
import { getDb } from "../db";
import { createAuditLog, createDomainEvent } from "./auditService";

export async function createEmployee(
  tenantId: number,
  firstName: string,
  lastName: string,
  email: string,
  baseSalary: number,
  hireDate: Date,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(employees).values({
    tenantId,
    firstName,
    lastName,
    email,
    baseSalary: baseSalary.toString(),
    hireDate,
    isMinor: false,
    createdBy: userId,
  });

  const employeeId = result[0].insertId as number;

  await createDomainEvent({
    tenantId,
    aggregateType: "employee",
    aggregateId: String(employeeId),
    eventType: "EmployeeCreated",
    eventData: {
      firstName,
      lastName,
      email,
      baseSalary,
      hireDate,
    },
  });

  await createAuditLog({
    tenantId,
    userId,
    action: "employee_created",
    resourceType: "employee",
    resourceId: String(employeeId),
    afterState: { firstName, lastName, email, baseSalary },
  });

  return employeeId;
}

export async function getEmployee(tenantId: number, employeeId: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(employees)
    .where(and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getTenantEmployees(tenantId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(employees).where(eq(employees.tenantId, tenantId));
}

export async function updateEmployee(
  tenantId: number,
  employeeId: number,
  updates: Record<string, any>,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const before = await getEmployee(tenantId, employeeId);

  await db
    .update(employees)
    .set({
      ...updates,
      updatedBy: userId,
    })
    .where(and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId)));

  await createAuditLog({
    tenantId,
    userId,
    action: "employee_updated",
    resourceType: "employee",
    resourceId: String(employeeId),
    beforeState: before,
    afterState: updates,
  });
}
