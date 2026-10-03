import { beforeEach, describe, expect, it, vi } from "vitest";
import { maintenanceHandler } from "./maintenance";
import { sdk } from "./_core/sdk";

function responseMock() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as any;
  res.status.mockReturnValue(res);
  return res;
}

describe("Heartbeat maintenance handler", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("rejects non-cron callers", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ isCron: false } as any);
    const res = responseMock();
    await maintenanceHandler({ path: "/api/scheduled/maintenance" } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron-only" });
  });

  it("executes with a cron task identity", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ isCron: true, taskUid: "task_test" } as any);
    const res = responseMock();
    await maintenanceHandler({ path: "/api/scheduled/maintenance" } as any, res);
    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, taskUid: "task_test" }));
  });

  it("returns a sanitized JSON error", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(new Error("secret token should not leak"));
    const res = responseMock();
    await maintenanceHandler({ path: "/api/scheduled/maintenance" } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "secret token should not leak", context: expect.any(Object) }));
  });
});
