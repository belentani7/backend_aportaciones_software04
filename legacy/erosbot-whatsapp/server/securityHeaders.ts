import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const validRequestId = /^[a-zA-Z0-9_-]{8,96}$/;

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  const candidate = req.header("x-request-id");
  const requestId = candidate && validRequestId.test(candidate) ? candidate : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
}
