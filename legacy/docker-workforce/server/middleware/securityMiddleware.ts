import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
    }
    const limit = rateLimitStore.get(key)!;
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + windowMs;
    }
    limit.count++;
    if (limit.count > maxRequests) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",");
  const origin = req.headers.origin;
  if (typeof origin === "string" && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
}

export function cspMiddleware(req: Request, res: Response, next: NextFunction) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  (req as any).id = String(requestId);
  res.setHeader("X-Request-ID", String(requestId));
  next();
}

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${(req as any).id}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}
