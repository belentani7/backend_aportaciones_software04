import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

export function encrypt(plaintext: string, masterKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")]);

  return combined.toString("base64");
}

export function decrypt(ciphertext: string, masterKey: string): string {
  const combined = Buffer.from(ciphertext, "base64");

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function hashSensitiveData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  const masked = local.substring(0, 2) + "*".repeat(local.length - 4) + local.substring(local.length - 2);
  return `${masked}@${domain}`;
}

export function anonymizePhoneNumber(phone: string): string {
  return phone.substring(0, 3) + "*".repeat(phone.length - 6) + phone.substring(phone.length - 3);
}

export function anonymizeEmployeeName(name: string): string {
  const parts = name.split(" ");
  return parts.map((part) => part.charAt(0) + "*".repeat(part.length - 1)).join(" ");
}

export function generatePseudonym(): string {
  return "EMP_" + crypto.randomBytes(8).toString("hex").toUpperCase();
}
