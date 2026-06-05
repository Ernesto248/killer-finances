import { describe, expect, it } from "vitest";

import { calculateUpdatedPersonaBalances, filterPersonaOptions } from "@/lib/cuadres";

describe("calculateUpdatedPersonaBalances", () => {
  it("actualiza solo balanceCup con deudaFinalCup, no toca balanceUsd", () => {
    expect(
      calculateUpdatedPersonaBalances({
        currentBalanceUsd: 120,
        deudaFinalCup: 3500,
        totalZelleUsd: 45,
      })
    ).toEqual({ balanceCup: 3500 });
  });
});

describe("filterPersonaOptions", () => {
  it("filtra por nombre y alias sin distinguir mayusculas", () => {
    const personas = [
      { id: "1", nombre: "Maria Perez", alias: "mari" },
      { id: "2", nombre: "Carlos Diaz", alias: null },
    ];

    expect(filterPersonaOptions(personas, "MAR")).toHaveLength(1);
    expect(filterPersonaOptions(personas, "mari")[0]?.id).toBe("1");
  });
});
