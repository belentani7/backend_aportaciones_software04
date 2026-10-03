import { describe, expect, it } from "vitest";
import { createFlow } from "./db";

describe("createFlow destination validation", () => {
  it("rejects webhook saliente before any persistence", async () => {
    let insertCalls = 0;
    const repository = { insert: () => { insertCalls += 1; return { values: () => ({ $returningId: async () => [{ id: 1 }] }) }; } };
    await expect(createFlow({ nombre: "Flujo", descripción: "Descripción", reglas: "[]", umbralDeConfianzaMínima: 0.7, acciónDestino: "webhook saliente" }, repository)).rejects.toThrow("destinationUrl requerido");
    expect(insertCalls).toBe(0);
  });
});
