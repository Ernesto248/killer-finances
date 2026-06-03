import { describe, it, expect } from "vitest";
import { personaSchema, pagoSchema, wireSchema } from "../validations";

describe("personaSchema", () => {
  it("accepts valid persona data", () => {
    const result = personaSchema.safeParse({
      nombre: "Juan Perez",
      tipo: "REMESERO",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing nombre", () => {
    const result = personaSchema.safeParse({ tipo: "REMESERO" });
    expect(result.success).toBe(false);
  });

  it("rejects missing tipo", () => {
    const result = personaSchema.safeParse({ nombre: "Test" });
    expect(result.success).toBe(false);
  });

  it("applies defaults", () => {
    const result = personaSchema.parse({ nombre: "Test", tipo: "REMESERO" });
    expect(result.activo).toBe(true);
    expect(result.balanceUsd).toBe(0);
    expect(result.balanceCup).toBe(0);
  });
});

describe("pagoSchema", () => {
  it("requires positive monto", () => {
    const result = pagoSchema.safeParse({
      personaId: "abc",
      monto: -100,
      moneda: "CUP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero monto", () => {
    const result = pagoSchema.safeParse({
      personaId: "abc",
      monto: 0,
      moneda: "CUP",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid pago", () => {
    const result = pagoSchema.safeParse({
      personaId: "abc123",
      monto: 500000,
      moneda: "CUP",
      descripcion: "Pago parcial",
    });
    expect(result.success).toBe(true);
  });
});

describe("wireSchema", () => {
  it("requires compradorId", () => {
    const result = wireSchema.safeParse({
      montoUsd: 10000,
      tasaPactada: 630,
    });
    expect(result.success).toBe(false);
  });

  it("requires positive montoUsd", () => {
    const result = wireSchema.safeParse({
      compradorId: "abc",
      montoUsd: 0,
      tasaPactada: 630,
    });
    expect(result.success).toBe(false);
  });

  it("requires positive tasaPactada", () => {
    const result = wireSchema.safeParse({
      compradorId: "abc",
      montoUsd: 10000,
      tasaPactada: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid wire", () => {
    const result = wireSchema.safeParse({
      compradorId: "abc",
      montoUsd: 10000,
      tasaPactada: 630,
    });
    expect(result.success).toBe(true);
  });

  it("applies default monedaPago", () => {
    const result = wireSchema.parse({
      compradorId: "abc",
      montoUsd: 10000,
      tasaPactada: 630,
    });
    expect(result.monedaPago).toBe("CUP");
  });
});
