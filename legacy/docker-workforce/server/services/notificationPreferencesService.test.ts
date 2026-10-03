import { describe, expect, it } from "vitest";
import { buildNotificationPreferences } from "./notificationPreferencesService";

describe("notification preferences consent model", () => {
  it("enables notification channels only after explicit consent", () => {
    const preferences = buildNotificationPreferences(10, 20, {
      notificationConsent: true,
      notificationConsentAt: new Date("2026-08-18T10:00:00.000Z"),
      notificationConsentRevokedAt: null,
      notificationSoundEnabled: true,
    });

    expect(preferences.consentGiven).toBe(true);
    expect(preferences.desktopNotificationsEnabled).toBe(true);
    expect(preferences.complianceAlerts).toBe(true);
    expect(preferences.soundEnabled).toBe(true);
  });

  it("keeps every channel disabled when consent is absent", () => {
    const preferences = buildNotificationPreferences(10, 20, {
      notificationConsent: false,
      notificationConsentAt: null,
      notificationConsentRevokedAt: new Date("2026-08-18T10:00:00.000Z"),
      notificationSoundEnabled: false,
    });

    expect(preferences.consentGiven).toBe(false);
    expect(preferences.desktopNotificationsEnabled).toBe(false);
    expect(preferences.taskCompleteNotifications).toBe(false);
    expect(preferences.complianceAlerts).toBe(false);
    expect(preferences.soundEnabled).toBe(false);
  });

  it("preserves the database sound preference while consent controls delivery", () => {
    const preferences = buildNotificationPreferences(10, 20, {
      notificationConsent: false,
      notificationConsentAt: null,
      notificationConsentRevokedAt: new Date("2026-08-18T10:00:00.000Z"),
      notificationSoundEnabled: true,
    });

    expect(preferences.soundEnabled).toBe(true);
    expect(preferences.desktopNotificationsEnabled).toBe(false);
  });
});
