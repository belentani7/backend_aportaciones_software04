import { beforeAll, describe, expect, it, vi } from "vitest";

let security: typeof import("../server/_core/security");

beforeAll(async () => {
  process.env.JWT_SECRET = "security-test-secret-that-is-not-used-outside-vitest";
  vi.resetModules();
  security = await import("../server/_core/security");
});

describe("HARMONÍA security core", () => {
  it("encrypts with authenticated encryption and rejects tampering", () => {
    const encrypted = security.encryptSensitiveData("owner-only payload", "test-key");
    expect(encrypted.split(":")).toHaveLength(3);
    expect(security.decryptSensitiveData(encrypted, "test-key")).toBe("owner-only payload");

    const [iv, tag, cipherText] = encrypted.split(":");
    expect(() => security.decryptSensitiveData(`${iv}:${tag}:00${cipherText.slice(2)}`, "test-key")).toThrow();
  });

  it("creates stable CSRF tokens and rejects altered values", () => {
    const token = security.generateCSRFToken("42", "session-1");
    expect(security.verifyCSRFToken(token, "42", "session-1")).toBe(true);
    expect(security.verifyCSRFToken(`${token}x`, "42", "session-1")).toBe(false);
    expect(security.verifyCSRFToken(token, "43", "session-1")).toBe(false);
  });

  it("rejects path traversal outside the configured directory", () => {
    expect(security.validateFilePath("/srv/harmonia", "crm/index.html")).toBe(true);
    expect(security.validateFilePath("/srv/harmonia", "../secrets.env")).toBe(false);
    expect(security.validateFilePath("/srv/harmonia", "/etc/passwd")).toBe(false);
  });

  it("enforces the anonymous rate-limit window by identity", async () => {
    const identity = `vitest-${Date.now()}`;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await expect(security.checkRateLimit(identity, "api_anonymous")).resolves.toMatchObject({ allowed: true });
    }
    await expect(security.checkRateLimit(identity, "api_anonymous")).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });
});
