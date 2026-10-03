import { eq, and } from "drizzle-orm";
import { users, userTenantRoles } from "../../drizzle/schema";
import { getDb } from "../db";
import { createAuditLog } from "./auditService";

export interface NotificationPreferences {
  userId: number;
  tenantId: number;
  consentGiven: boolean;
  consentGivenAt: Date | null;
  consentRevokedAt: Date | null;
  taskCompleteNotifications: boolean;
  complianceAlerts: boolean;
  scheduleUpdates: boolean;
  payrollNotifications: boolean;
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
}

const preferencesCache = new Map<string, NotificationPreferences>();

type UserNotificationRow = Pick<typeof users.$inferSelect, "notificationConsent" | "notificationConsentAt" | "notificationConsentRevokedAt" | "notificationSoundEnabled">;

export function buildNotificationPreferences(userId: number, tenantId: number, userData: UserNotificationRow): NotificationPreferences {
  const consentGiven = userData.notificationConsent ?? false;
  return {
    userId,
    tenantId,
    consentGiven,
    consentGivenAt: userData.notificationConsentAt,
    consentRevokedAt: userData.notificationConsentRevokedAt,
    taskCompleteNotifications: consentGiven,
    complianceAlerts: consentGiven,
    scheduleUpdates: consentGiven,
    payrollNotifications: consentGiven,
    soundEnabled: userData.notificationSoundEnabled ?? true,
    desktopNotificationsEnabled: consentGiven,
  };
}

async function assertTenantMembership(db: Awaited<ReturnType<typeof getDb>>, userId: number, tenantId: number): Promise<void> {
  if (!db) throw new Error("Database not available");
  const membership = await db.select({ id: userTenantRoles.id }).from(userTenantRoles).where(
    and(eq(userTenantRoles.userId, userId), eq(userTenantRoles.tenantId, tenantId)),
  ).limit(1);
  if (membership.length === 0) throw new Error("User is not a member of this tenant");
}

export async function getNotificationPreferences(
  userId: number,
  tenantId: number
): Promise<NotificationPreferences> {
  const cacheKey = `${tenantId}:${userId}`;
  if (preferencesCache.has(cacheKey)) {
    return preferencesCache.get(cacheKey)!;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertTenantMembership(db, userId, tenantId);
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (user.length === 0) {
    throw new Error("User not found");
  }

  const userData = user[0];
  const preferences = buildNotificationPreferences(userId, tenantId, userData);

  preferencesCache.set(cacheKey, preferences);
  return preferences;
}

export async function grantNotificationConsent(
  userId: number,
  tenantId: number,
  requestedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertTenantMembership(db, userId, tenantId);
  await db
    .update(users)
    .set({
      notificationConsent: true,
      notificationConsentAt: new Date(),
      notificationConsentRevokedAt: null,
    })
    .where(eq(users.id, userId));

  preferencesCache.delete(`${tenantId}:${userId}`);

  await createAuditLog({
    tenantId,
    userId: requestedBy,
    action: "notification_consent_granted",
    resourceType: "user",
    resourceId: String(userId),
    afterState: { consentGiven: true, timestamp: new Date() },
  });
}

export async function revokeNotificationConsent(
  userId: number,
  tenantId: number,
  requestedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertTenantMembership(db, userId, tenantId);
  await db
    .update(users)
    .set({
      notificationConsent: false,
      notificationConsentRevokedAt: new Date(),
      notificationSoundEnabled: false,
    })
    .where(eq(users.id, userId));

  preferencesCache.delete(`${tenantId}:${userId}`);

  await createAuditLog({
    tenantId,
    userId: requestedBy,
    action: "notification_consent_revoked",
    resourceType: "user",
    resourceId: String(userId),
    afterState: { consentGiven: false, timestamp: new Date() },
  });
}

export async function updateNotificationPreferences(
  userId: number,
  tenantId: number,
  updates: Partial<NotificationPreferences>,
  requestedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await assertTenantMembership(db, userId, tenantId);
  const updateData: Record<string, unknown> = {};

  if (updates.soundEnabled !== undefined) {
    updateData.notificationSoundEnabled = updates.soundEnabled;
  }
  if (updates.desktopNotificationsEnabled === false) {
    updateData.notificationConsent = false;
    updateData.notificationConsentRevokedAt = new Date();
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  preferencesCache.delete(`${tenantId}:${userId}`);

  await createAuditLog({
    tenantId,
    userId: requestedBy,
    action: "notification_preferences_updated",
    resourceType: "user",
    resourceId: String(userId),
    afterState: updates,
  });
}

export function clearPreferencesCache(): void {
  preferencesCache.clear();
}
