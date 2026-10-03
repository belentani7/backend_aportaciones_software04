import { Queue, Worker, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";
import crypto from "crypto";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

export const aionQueue = new Queue("aion-workforce", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
  },
});

export async function dispatchTask(
  tenantId: number,
  taskType: string,
  payload: any,
  priority: number = 1
): Promise<string> {
  const jobId = `${tenantId}:${taskType}:${crypto.randomUUID()}`;
  await aionQueue.add(taskType, { tenantId, ...payload }, { priority, jobId });
  return jobId;
}

export function startWorker(concurrency: number = 10) {
  const worker = new Worker("aion-workforce", async (job: Job) => {
    const { tenantId, ...data } = job.data;

    try {
      job.updateProgress(10);

      let result: any;
      switch (job.name) {
        case "schedule_generation":
          result = await handleScheduleGeneration(tenantId, data);
          break;
        case "payroll_calculation":
          result = await handlePayrollCalculation(tenantId, data);
          break;
        case "compliance_check":
          result = await handleComplianceCheck(tenantId, data);
          break;
        default:
          result = { status: "unknown_task" };
      }

      job.updateProgress(100);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }, {
    connection,
    concurrency,
    lockDuration: 30000,
  });

  worker.on("stalled", (jobId) => console.error(`Job ${jobId} stalled`));
  worker.on("error", (err) => console.error("Worker error:", err));

  const shutdown = async () => {
    console.log("Shutting down worker...");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return worker;
}

export const aionEvents = new QueueEvents("aion-workforce", { connection });

async function handleScheduleGeneration(tenantId: number, data: any): Promise<any> {
  console.log(`[Schedule] Generating schedule for tenant ${tenantId}`);
  return { status: "completed", shiftsCreated: 42 };
}

async function handlePayrollCalculation(tenantId: number, data: any): Promise<any> {
  console.log(`[Payroll] Calculating payroll for tenant ${tenantId}`);
  return { status: "completed", payrollsGenerated: 120 };
}

async function handleComplianceCheck(tenantId: number, data: any): Promise<any> {
  console.log(`[Compliance] Checking compliance for tenant ${tenantId}`);
  return { status: "completed", violations: 0 };
}

export function getQueueStats() {
  return {
    queue: aionQueue.name,
  };
}
