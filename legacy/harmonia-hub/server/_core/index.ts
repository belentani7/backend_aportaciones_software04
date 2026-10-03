import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { handleAutomationHeartbeat } from "../automation/http";
import { registerCrmRoutes } from "../automation/crm-http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { rateLimitMiddleware, securityHeadersMiddleware, securityLoggingMiddleware } from "./security-middleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);

  const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    "https://belentani.com",
    "https://api.belentani.com",
    "https://app.belentani.com",
    ...configuredOrigins,
  ]);
  const isDevelopmentOrigin = (origin: string) => process.env.NODE_ENV !== "production" && (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    /^https:\/\/[^/]+\.manus\.computer$/.test(origin)
  );

  app.use(securityHeadersMiddleware);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      if (!allowedOrigins.has(origin) && !isDevelopmentOrigin(origin)) {
        return res.status(403).json({ error: "Origin is not allowed" });
      }
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(rateLimitMiddleware);
  app.use(securityLoggingMiddleware);

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const crmDirectory = path.join(process.cwd(), "crm");
  app.use("/crm", express.static(crmDirectory, { index: "index.html" }));
  app.post("/api/scheduled/automation", handleAutomationHeartbeat);
  registerCrmRoutes(app);

  app.get("/api/health", (_req, res) => {
    const databaseConfigured = Boolean(process.env.DATABASE_URL);
    res.json({ ok: true, databaseConfigured, timestamp: Date.now() });
  });

  app.get("/api/health/automation", async (_req, res) => {
    res.json({ ok: true, callback: "/api/scheduled/automation", timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
