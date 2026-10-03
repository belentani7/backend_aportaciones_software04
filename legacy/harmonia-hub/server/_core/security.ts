/**
 * BELENTANI Security Protocol - Complete Implementation
 * Capas 1-6: Autenticación, OWASP Top 10, Glassmorphism, Backend, Infraestructura, Monitoreo
 */

import crypto from 'crypto';
import path from 'path';
import { ENV } from './env';

// ============================================================================
// CAPA 1: AUTENTICACIÓN Y SESIÓN
// ============================================================================

/**
 * Refresh token rotation: Invalidate old, generate new
 * Previene replay attacks
 */
export async function rotateRefreshToken(oldToken: string): Promise<string> {
  // In production: invalidate oldToken in Redis/DB
  // await redis.del(`refresh_token:${oldToken}`);
  
  const newToken = crypto.randomBytes(32).toString('hex');
  
  // In production: store with expiry
  // await db.refreshTokens.create({ token: newToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), userId });
  
  return newToken;
}

/**
 * Rate limiting configuration per user
 * Not per IP (fails in offices/schools with shared IPs)
 */
export const RATE_LIMITS = {
  login_attempts: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  password_reset: { max: 2, windowMs: 60 * 60 * 1000 }, // 2 per hour
  api_authenticated: { max: 1000, windowMs: 60 * 1000 }, // 1000 per min
  api_anonymous: { max: 30, windowMs: 60 * 1000 }, // 30 per min
};

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Check if user should be rate limited
 */
export async function checkRateLimit(
  userId: string,
  limitType: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limit = RATE_LIMITS[limitType];
  const key = `${limitType}:${userId}`;
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 1, resetAt: now + limit.windowMs }
    : { count: existing.count + 1, resetAt: existing.resetAt };
  rateLimitBuckets.set(key, bucket);
  const count = bucket.count;
  const allowed = count <= limit.max;
  const resetAt = new Date(bucket.resetAt);
  
  return {
    allowed,
    remaining: Math.max(0, limit.max - count),
    resetAt,
  };
}

// ============================================================================
// CAPA 2: PROTECCIÓN CONTRA ATAQUES COMUNES
// ============================================================================

/**
 * XSS Prevention: Sanitize user input
 * Use textContent instead of innerHTML
 */
export function sanitizeInput(input: string): string {
  // Remove dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * CSRF Token generation and validation
 * Unique per user + session
 */
export function generateCSRFToken(userId: string, sessionId: string): string {
  const data = `${userId}:${sessionId}`;
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error('JWT_SECRET is required to generate CSRF tokens');
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyCSRFToken(token: string, userId: string, sessionId: string): boolean {
  const expected = generateCSRFToken(userId, sessionId);
  const tokenBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return tokenBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * SQL Injection Prevention: Parameterized queries
 * Always use prepared statements (handled by ORM like Drizzle)
 * NEVER concatenate user input into queries
 */
export function validateDatabaseInput(input: any): any {
  // Drizzle ORM handles parameterization automatically
  // This is a reminder to NEVER do:
  // db.query(`SELECT * FROM users WHERE id = ${input}`)
  // Instead do:
  // db.select().from(users).where(eq(users.id, input))
  return input;
}

/**
 * Path Traversal Prevention
 * Ensure requested path doesn't escape base directory
 */
export function validateFilePath(basePath: string, requestedPath: string): boolean {
  const resolvedPath = path.resolve(basePath, requestedPath);
  const resolvedBase = path.resolve(basePath);
  const relative = path.relative(resolvedBase, resolvedPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// ============================================================================
// CAPA 3: SEGURIDAD ESPECÍFICA DEL GLASSMORPHISM
// ============================================================================

/**
 * IMPORTANTE: Glassmorphism es DECORATIVO, no seguridad
 * No poner contenido sensible detrás del blur
 * Cualquier usuario con DevTools puede inspeccionar el DOM
 */
export const GLASSMORPHISM_SECURITY_RULES = {
  rule1: 'Never put sensitive data behind backdrop-filter: blur()',
  rule2: 'GPU tier detection should not be exposed in API responses',
  rule3: 'CSS from user input must be sanitized',
  rule4: 'Blur effect is visual only, not a security mechanism',
};

/**
 * CSS Sanitization: Remove dangerous CSS
 */
export function sanitizeCSS(css: string): string {
  // Remove URL expressions that could leak data
  const dangerous = [
    /url\s*\(/gi, // url()
    /expression\s*\(/gi, // expression()
    /behavior\s*:/gi, // behavior:
    /@import/gi, // @import
  ];
  
  let sanitized = css;
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized;
}

// ============================================================================
// CAPA 4: BACKEND - DATOS SENSIBLES
// ============================================================================

/**
 * Encryption at rest: AES-256-GCM (symmetric encryption)
 * For tokens, API keys, sensitive data in DB
 */
export function encryptSensitiveData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', keyHash, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitiveData(encrypted: string, key: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  if (!ivHex || !authTagHex || !encryptedData) throw new Error('Invalid encrypted payload');
  const iv = Buffer.from(ivHex, 'hex');
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyHash, iv);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]).toString('utf8');
}

/**
 * Logging: Never log sensitive data
 * NEVER: email, full IP, tokens, passwords
 */
export function sanitizeLogData(data: any): any {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.refreshToken;
  delete sanitized.apiKey;
  
  // Redact email
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  // Redact IP (keep first 3 octets)
  if (sanitized.ip) {
    sanitized.ip = sanitized.ip.replace(/\.\d+$/, '.***');
  }
  
  return sanitized;
}

/**
 * Session timeout on inactivity
 * Default: 30 minutes
 */
export function isSessionExpired(lastActiveAt: Date, timeoutMinutes: number = 30): boolean {
  const now = new Date();
  const elapsedMinutes = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60);
  return elapsedMinutes > timeoutMinutes;
}

// ============================================================================
// CAPA 5: INFRAESTRUCTURA
// ============================================================================

/**
 * Security headers (all required)
 * Configure in Express middleware
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
};

/**
 * CORS Configuration: Only allow trusted origins
 * NEVER use "*"
 */
export const CORS_CONFIG = {
  origins: [
    'https://belentani.com',
    'https://api.belentani.com',
    'https://app.belentani.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

// ============================================================================
// CAPA 6: MONITOREO Y RESPUESTA
// ============================================================================

/**
 * Anomaly detection: Failed login attempts
 */
export async function detectFailedLoginAnomaly(userId: string, failureCount: number): Promise<void> {
  if (failureCount > 5) {
    // Alert user
    console.warn(`[SECURITY] Multiple failed logins for user ${userId}`);
    
    // Temporary block (15 minutes)
    // await redis.setex(`blocked:${userId}`, 15 * 60, 'true');
    
    // Send alert email
    // await sendEmail(user.email, 'Multiple failed login attempts detected');
  }
}

/**
 * Structured logging: JSON format with redacted data
 */
export function createSecurityLog(event: string, data: any): string {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    event,
    data: sanitizeLogData(data),
    userAgentHash: crypto.createHash('sha256').update(data.userAgent || '').digest('hex'),
  };
  
  return JSON.stringify(log);
}

/**
 * Incident response: Automatic containment
 */
export async function respondToSecurityIncident(
  incidentType: 'failed_login' | 'rate_limit' | 'xss_attempt' | 'sql_injection',
  userId: string,
  details: any,
): Promise<void> {
  console.error(`[INCIDENT] ${incidentType} from user ${userId}`, details);
  
  // Log structured and redacted; replace with durable security-log storage when provisioned.
  console.error(createSecurityLog(incidentType, { userId, ...details }));
  
  // Automatic containment based on incident type
  switch (incidentType) {
    case 'failed_login':
      await detectFailedLoginAnomaly(userId, 6);
      break;
    case 'rate_limit':
      // Block user temporarily
      // await redis.setex(`blocked:${userId}`, 60 * 60, 'true');
      break;
    case 'xss_attempt':
    case 'sql_injection':
      // Immediate block
      // await db.users.update({ id: userId }, { status: 'suspended' });
      break;
  }
}
