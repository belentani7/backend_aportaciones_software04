import { describe, expect, it } from "vitest";
import { createConfiguredApp } from "./_core/index";

describe("Express real route stack", () => {
  it("does not mount any third-party economic endpoints", async () => {
    const { app } = await createConfiguredApp(false);
    const stack = ((app as any).router ?? (app as any)._router).stack;
    const paths = stack
      .map((layer: any) => layer.route?.path || layer.regexp?.toString())
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const forbidden = /booking|reservation|escrow|split|refund|commission|checkout/i;
    expect(paths).not.toMatch(forbidden);
    expect(paths).toContain("whatsapp");
    expect(paths).toContain("maintenance");
    expect(paths).toContain("oauth/callback");
    expect(paths).toContain("manus-storage");
    expect(stack.some((layer: any) => layer.handle && typeof layer.handle === "function")).toBe(true);
  });
});
