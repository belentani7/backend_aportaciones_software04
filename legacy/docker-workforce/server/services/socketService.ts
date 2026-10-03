import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";
import { jwtVerify, type JWTPayload } from "jose";

type WorkforceClaims = JWTPayload & {
  tenant_id?: string | number;
};

export async function initializeSocketIO(httpServer: any): Promise<SocketIOServer> {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(",") || "*",
      methods: ["GET", "POST"],
    },
    perMessageDeflate: { threshold: 1024 },
  });

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = new IORedis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
    } catch (error) {
      pubClient.disconnect();
      subClient.disconnect();
      console.warn("[Socket.io] Redis adapter unavailable; using single-instance mode", error);
    }
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string" || !token) {
        return next(new Error("No token provided"));
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");
      const { payload } = await jwtVerify(token, secret);
      const claims = payload as WorkforceClaims;
      const userId = claims.sub;
      const tenantId = claims.tenant_id;

      if (!userId || tenantId === undefined) {
        return next(new Error("Invalid workforce claims"));
      }

      (socket as any).userId = userId;
      (socket as any).tenantId = tenantId;

      socket.join(`tenant:${tenantId}`);
      socket.join(`user:${userId}`);

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] User ${(socket as any).userId} connected`);

    socket.on("disconnect", () => {
      console.log(`[Socket.io] User ${(socket as any).userId} disconnected`);
    });
  });

  return io;
}

export function broadcastToTenant(io: SocketIOServer, tenantId: number, event: string, data: any): void {
  io.to(`tenant:${tenantId}`).emit(event, data);
}

export function broadcastToUser(io: SocketIOServer, userId: number, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function broadcastToAll(io: SocketIOServer, event: string, data: any): void {
  io.emit(event, data);
}
