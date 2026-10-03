import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { enqueueEvent, eventPayloadSchema, processPendingEvents, reprocessPendingExceptions } from "../automation";
import { isWebhookSecretValid } from "../webhookAuth";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.post("/api/webhook/:flowId", async (req, res) => {
    const configuredSecret = process.env.WEBHOOK_SHARED_SECRET;
    const suppliedSecret = req.header("x-webhook-secret") ?? "";
    if (!configuredSecret) return res.status(503).json({ error: "webhook no configurado" });
    if (!isWebhookSecretValid(configuredSecret, suppliedSecret)) return res.status(401).json({ error: "webhook no autorizado" });
    const flowId = Number(req.params.flowId);
    const idempotencyKey = req.header("idempotency-key") ?? req.header("x-idempotency-key") ?? undefined;
    if (!Number.isInteger(flowId) || flowId <= 0) return res.status(400).json({ error: "flowId inválido" });
    const parsedPayload = eventPayloadSchema.safeParse(req.body);
    if (!parsedPayload.success) return res.status(400).json({ error: "payload JSON inválido", issues: parsedPayload.error.issues });
    try {
      const result = await enqueueEvent(flowId, idempotencyKey, parsedPayload.data);
      return res.status(result.duplicate ? 200 : 202).json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Error interno" });
    }
  });

  app.post("/api/scheduled/process-events", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await processPendingEvents(25);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Error interno" });
    }
  });
  app.post("/api/scheduled/reprocess-exceptions", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await reprocessPendingExceptions(10);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Error interno" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
