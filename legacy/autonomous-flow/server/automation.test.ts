import { describe, expect, it } from "vitest";
import { analysisSchema, assignIdempotencyKey, calculateTokenCost, deterministicMatch, eventPayloadSchema, retry, transient } from "./automation";

describe("automation engine", () => {
  it("validates the exact structured LLM output", () => {
    const result = analysisSchema.parse({ categoría: "billing", prioridad: "alta", sentimiento: "negativo", resumen: "Cobro duplicado detectado.", "acción sugerida": "Revisar la factura.", "nivel de confianza": 0.92 });
    expect(result["nivel de confianza"]).toBe(0.92);
    expect(() => analysisSchema.parse({ categoría: "billing" })).toThrow();
  });

  it("rejects an empty event payload without inventing required fields", () => {
    expect(eventPayloadSchema.safeParse({}).success).toBe(false);
    expect(eventPayloadSchema.safeParse({ evento: "ticket" }).success).toBe(true);
  });

  it("assigns stable idempotency keys and preserves supplied keys", () => {
    expect(assignIdempotencyKey({ evento: "ticket" })).toBe(assignIdempotencyKey({ evento: "ticket" }));
    expect(assignIdempotencyKey({ evento: "ticket" }, "manual-key")).toBe("manual-key");
  });

  it("classifies matching events without invoking IA", () => {
    expect(deterministicMatch({ message: "Refund requested" }, '[{"contains":"refund","categoría":"billing"}]')).toMatchObject({ matched: true });
    expect(deterministicMatch({ message: "Hello" }, '[{"contains":"refund"}]')).toMatchObject({ matched: false });
  });

  it("calculates monetary token cost from usage", () => {
    expect(calculateTokenCost({ prompt_tokens: 1_000_000, completion_tokens: 1_000_000 })).toBe("0.75000000");
  });

  it("retries transient failures and stops on permanent failures", async () => {
    let attempts = 0;
    await expect(retry(async () => { attempts += 1; if (attempts < 2) throw { status: 503 }; return "ok"; }, 3)).resolves.toBe("ok");
    expect(attempts).toBe(2);
    await expect(retry(async () => { throw { status: 400 }; }, 3)).rejects.toMatchObject({ status: 400 });
  });

  it("recognizes transient failures", () => {
    expect(transient({ status: 429 })).toBe(true);
    expect(transient({ status: 503 })).toBe(true);
    expect(transient({ status: 400 })).toBe(false);
    expect(transient(new Error("invalid payload"))).toBe(false);
  });
});
