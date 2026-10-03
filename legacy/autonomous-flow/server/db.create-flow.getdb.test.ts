import { describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const getDb = vi.fn(async () => ({ insert }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb };
});

const { createFlow } = await import("./db");

describe("createFlow database boundary", () => {
  it("does not call getDb or insert for an invalid outbound destination", async () => {
    await expect(createFlow({ nombre: "Flujo", descripción: "Descripción", reglas: "[]", umbralDeConfianzaMínima: 0.7, acciónDestino: "webhook saliente" })).rejects.toThrow("destinationUrl requerido");
    expect(getDb).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
