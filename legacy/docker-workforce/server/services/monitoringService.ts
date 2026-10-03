import { cacheManager } from "./cacheService";
import { getConnectionStats } from "./websocketService";

interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cache: Record<string, any>;
  connections: Record<string, any>;
  requests: {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
  };
}

class MonitoringService {
  private startTime = Date.now();
  private requestMetrics = {
    total: 0,
    success: 0,
    errors: 0,
    totalResponseTime: 0,
  };

  recordRequest(responseTime: number, success: boolean): void {
    this.requestMetrics.total++;
    if (success) {
      this.requestMetrics.success++;
    } else {
      this.requestMetrics.errors++;
    }
    this.requestMetrics.totalResponseTime += responseTime;
  }

  getMetrics(): SystemMetrics {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime =
      this.requestMetrics.total > 0
        ? this.requestMetrics.totalResponseTime / this.requestMetrics.total
        : 0;

    return {
      timestamp: new Date(),
      uptime,
      memory: process.memoryUsage(),
      cache: cacheManager.getStats(),
      connections: getConnectionStats(),
      requests: {
        total: this.requestMetrics.total,
        success: this.requestMetrics.success,
        errors: this.requestMetrics.errors,
        avgResponseTime,
      },
    };
  }

  getHealthStatus(): { status: "healthy" | "degraded" | "unhealthy"; details: Record<string, any> } {
    const metrics = this.getMetrics();
    const memUsage = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    const errorRate = metrics.requests.total > 0 ? (metrics.requests.errors / metrics.requests.total) * 100 : 0;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (memUsage > 90 || errorRate > 10) {
      status = "unhealthy";
    } else if (memUsage > 75 || errorRate > 5) {
      status = "degraded";
    }

    return {
      status,
      details: {
        memoryUsage: `${memUsage.toFixed(2)}%`,
        errorRate: `${errorRate.toFixed(2)}%`,
        uptime: `${(metrics.uptime / 1000 / 60).toFixed(2)}m`,
        activeConnections: metrics.connections.totalConnections,
      },
    };
  }

  reset(): void {
    this.requestMetrics = { total: 0, success: 0, errors: 0, totalResponseTime: 0 };
  }
}

export const monitoringService = new MonitoringService();
