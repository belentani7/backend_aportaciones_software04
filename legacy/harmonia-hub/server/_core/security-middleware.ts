/**
 * Security Middleware for Express
 * Implementa todas las capas del protocolo de seguridad
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { SECURITY_HEADERS, CORS_CONFIG, RATE_LIMITS, checkRateLimit, sanitizeInput, generateCSRFToken, respondToSecurityIncident } from './security';

/**
 * Middleware 1: Security Headers
 * Aplica headers de seguridad a todas las respuestas
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
}

/**
 * Middleware 2: CORS Validation
 * Solo permite orígenes confiables
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (origin && CORS_CONFIG.origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', CORS_CONFIG.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

/**
 * Middleware 3: Rate Limiting por Usuario
 * Previene abuso por usuario, no por IP
 */
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id || req.ip || 'anonymous';
    
    // Determinar tipo de límite según ruta
    let limitType: 'api_authenticated' | 'api_anonymous' = 'api_anonymous';
    if ((req as any).user) {
      limitType = 'api_authenticated';
    }
    
    const limit = await checkRateLimit(userId, limitType);
    
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMITS[limitType].max));
    res.setHeader('X-RateLimit-Remaining', limit.remaining);
    res.setHeader('X-RateLimit-Reset', limit.resetAt.toISOString());
    
    if (!limit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
      });
    }
    
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next(); // Fail open
  }
}

/**
 * Middleware 4: CSRF Token Validation
 * Valida tokens CSRF en POST/PUT/DELETE
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] as string;
    const userId = (req as any).user?.id;
    const sessionId = (req as any).sessionId;
    
    if (!userId || !sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!token) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    
    // Verify CSRF token
    const expectedToken = generateCSRFToken(userId, sessionId);
    if (token !== expectedToken) {
      respondToSecurityIncident('xss_attempt', userId, { reason: 'Invalid CSRF token' });
      return res.status(403).json({ error: 'CSRF token invalid' });
    }
  }
  
  next();
}

/**
 * Middleware 5: Input Sanitization
 * Sanitiza inputs de usuario en query/body
 */
export function sanitizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string);
      }
    });
  }
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  
  next();
}

/**
 * Middleware 6: Session Timeout
 * Invalida sesiones inactivas después de 30 minutos
 */
export function sessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  
  if (session && session.lastActive) {
    const inactiveMinutes = (Date.now() - session.lastActive.getTime()) / (1000 * 60);
    
    if (inactiveMinutes > 30) {
      // Session expired
      (req as any).user = null;
      return res.status(401).json({ error: 'Session expired' });
    }
  }
  
  // Update last active time
  if (session) {
    session.lastActive = new Date();
  }
  
  next();
}

/**
 * Middleware 7: Error Handler (Security-aware)
 * Nunca expone detalles internos en errores
 */
export function securityErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('[ERROR]', err);
  
  // Detectar tipo de error
  if (err.code === 'EBADCSRFTOKEN') {
    respondToSecurityIncident('xss_attempt', (req as any).user?.id || 'unknown', { error: err.message });
    return res.status(403).json({ error: 'Security validation failed' });
  }
  
  if (err.code === 'EACCES') {
    respondToSecurityIncident('sql_injection', (req as any).user?.id || 'unknown', { error: err.message });
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Generic error response (never expose internals)
  res.status(err.status || 500).json({
    error: 'Internal server error',
    // En desarrollo, puedes agregar err.message
    // En producción, NUNCA expongas detalles
  });
}

/**
 * Middleware 8: Request Logging (Security-aware)
 * Registra requests sin exponer datos sensibles
 */
export function securityLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: (req as any).user?.id || 'anonymous',
      ipHash: crypto.createHash('sha256').update(req.ip || '').digest('hex').slice(0, 8),
    };
    
    // Log only to structured logger, not console in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[REQUEST]', JSON.stringify(log));
    }
  });
  
  next();
}

/**
 * Middleware Stack: Apply all security middleware
 */
export function applySecurityMiddleware(app: any) {
  // Order matters!
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(sanitizationMiddleware);
  app.use(rateLimitMiddleware);
  app.use(csrfMiddleware);
  app.use(sessionTimeoutMiddleware);
  app.use(securityLoggingMiddleware);
  app.use(securityErrorHandler);
}
