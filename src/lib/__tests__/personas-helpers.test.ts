import { describe, expect, it } from "vitest";

import { mapPersonaRaw } from "@/lib/personas-mapper";

describe("mapPersonaRaw", () => {
  it("mapea campos snake_case a camelCase", () => {
    const mapped = mapPersonaRaw({
      id: "persona-1",
      nombre: "Maria",
      telefono: "+53 555",
      alias: "mary",
      balance_usd: 12.5,
      balance_cup: 600,
      tipo: "REMESERO",
      activo: true,
      created_at: new Date("2026-01-02T00:00:00.000Z"),
      updated_at: new Date("2026-01-03T00:00:00.000Z"),
    });

    expect(mapped).toEqual({
      id: "persona-1",
      nombre: "Maria",
      telefono: "+53 555",
      alias: "mary",
      balanceUsd: 12.5,
      balanceCup: 600,
      tipo: "REMESERO",
      activo: true,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      updatedAt: new Date("2026-01-03T00:00:00.000Z"),
    });
  });
});
