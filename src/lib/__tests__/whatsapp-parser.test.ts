import { describe, it, expect } from "vitest";
import { parseWhatsAppText } from "../whatsapp-parser";

describe("parseWhatsAppText", () => {
  it("parses a valid cuadre message", () => {
    const text = `🚩 INICIO
       $ 67.879 deuda
🪎 PAGADO
       $ 900.000
🇺🇲 TIRADO
           438 x 565
         2139 x 570
🚩 FINAL
       $ 634.579 deuda`;

    const result = parseWhatsAppText(text);

    expect(result.deudaInicialCup).toBe(67879);
    expect(result.pagadoCup).toBe(900000);
    expect(result.lineasTirado).toHaveLength(2);
    expect(result.lineasTirado[0]).toEqual({
      montoUsd: 438,
      tasa: 565,
      montoCupResultante: 247470,
      modalidad: "TASA",
    });
    expect(result.lineasTirado[1]).toEqual({
      montoUsd: 2139,
      tasa: 570,
      montoCupResultante: 1219230,
      modalidad: "TASA",
    });
    expect(result.deudaFinalCup).toBe(634579);
    expect(result.totalZelleUsd).toBe(2577);
    expect(result.valid).toBe(true);
  });

  it("reports invalid when deuda final does not match calculation", () => {
    const text = `🚩 INICIO
       $ 100 deuda
🇺🇲 TIRADO
           100 x 500
🚩 FINAL
       $ 999 deuda`;

    const result = parseWhatsAppText(text);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles empty text gracefully", () => {
    const result = parseWhatsAppText("");
    expect(result.lineasTirado).toHaveLength(0);
    expect(result.totalZelleUsd).toBe(0);
  });

  it("parses numbers with commas as decimal separators", () => {
    const text = `🚩 INICIO
       $ 67.879 deuda
🇺🇲 TIRADO
           100 x 580,50
🚩 FINAL
       $ 125.929 deuda`;

    const result = parseWhatsAppText(text);
    expect(result.lineasTirado[0].tasa).toBe(580.5);
    expect(result.valid).toBe(true);
    expect(result.deudaInicialCup).toBe(67879);
    expect(result.deudaFinalCup).toBe(125929);
  });

  it("calculates tasa promedio correctly", () => {
    const text = `🚩 INICIO
       $ 0 deuda
🇺🇲 TIRADO
           100 x 500
           200 x 600
🚩 FINAL
       $ 170.000 deuda`;

    const result = parseWhatsAppText(text);
    expect(result.tasaPromedioCup).toBe(566.67);
  });

  it("handles text with only deuda sections and no tirado", () => {
    const text = `🚩 INICIO
       $ 500 deuda
🚩 FINAL
       $ 500 deuda`;

    const result = parseWhatsAppText(text);
    expect(result.lineasTirado).toHaveLength(0);
    expect(result.totalZelleUsd).toBe(0);
    expect(result.deudaInicialCup).toBe(500);
    expect(result.deudaFinalCup).toBe(500);
    expect(result.valid).toBe(true);
  });
});
