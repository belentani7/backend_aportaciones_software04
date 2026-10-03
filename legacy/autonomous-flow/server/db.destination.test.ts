import { describe, expect, it } from "vitest";
import { resolveDestinationUrl } from "./db";

describe("flow destination contract", () => {
  it("requires a valid HTTPS destination for webhook saliente", () => {
    expect(() => resolveDestinationUrl("webhook saliente")).toThrow("destinationUrl requerido");
    expect(() => resolveDestinationUrl("webhook saliente", "http://example.test/events")).toThrow("HTTPS");
    expect(resolveDestinationUrl("webhook saliente", "https://example.test/events")).toBe("https://example.test/events");
    expect(resolveDestinationUrl("log interno")).toBeNull();
  });
});
