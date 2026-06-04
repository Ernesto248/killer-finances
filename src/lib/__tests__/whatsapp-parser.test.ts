import { describe, it, expect } from "vitest";
import { parseWhatsAppText } from "../whatsapp-parser";

describe("parseWhatsAppText", () => {
  it("parses the real Gea Zll cuadre with multiple pagos", () => {
    const text = `🚩 🅸🅽🅸🅲🅸🅾 📖 
       *$* *408.172* \`deuda\`

🪎 🅟🅐🅶🅐🅳🅞 
       \`$ 860,000\`
       \`$ 1,120,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂 
       0 × 575

🇺🇲 🆃🅸🆁🅰🅳🅞 🇲🇽
         720 × 575
         350 × 540
         786 × 585
           30 × 590
      1949 × 595
       3145 × 600

🚩 🅵🅸🅽🅰🅻 📕
       *$* *2.555.337* \`deuda\`

@⁨Gea Zll⁩  \`\`\`RECTIFICAR\`\`\``;

    const result = parseWhatsAppText(text);

    expect(result.deudaInicialCup).toBe(408172);
    expect(result.pagadoCup).toBe(860000 + 1120000);
    expect(result.lineasTirado).toHaveLength(6);
    expect(result.lineasTirado[0]).toEqual({ montoUsd: 720, tasa: 575, montoCupResultante: 414000, modalidad: "TASA" });
    expect(result.lineasTirado[3]).toEqual({ montoUsd: 30, tasa: 590, montoCupResultante: 17700, modalidad: "TASA" });
    expect(result.lineasTirado[5]).toEqual({ montoUsd: 3145, tasa: 600, montoCupResultante: 1887000, modalidad: "TASA" });
    expect(result.deudaFinalCup).toBe(2555337);
    expect(result.totalZelleUsd).toBe(720 + 350 + 786 + 30 + 1949 + 3145);
    expect(result.valid).toBe(true);
  });

  it("parses the Yohan cuadre with fondo result", () => {
    const text = `🚩 🅸🅽🅸🅲🅸🅾 📖 
       *$* *101.793* \`deuda\`

🪎 🅟🅐🅶🅐🅳🅞 
       \`$ 1,620,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂 
       0 × 0

🇺🇲 🆃🅸🆁🅰🅳🅞 🇲🇽
         150 × 573
       2229 × 575

🚩 🅵🅸🅽🅰🅻 📕
       *$* *150.582* \`fondo\`

@⁨Yohan 2 Remesero⁩  \`\`\`RECTIFICAR\`\`\``;

    const result = parseWhatsAppText(text);

    expect(result.deudaInicialCup).toBe(101793);
    expect(result.pagadoCup).toBe(1620000);
    expect(result.lineasTirado).toHaveLength(2);
    expect(result.lineasTirado[0]).toEqual({ montoUsd: 150, tasa: 573, montoCupResultante: 85950, modalidad: "TASA" });
    expect(result.lineasTirado[1]).toEqual({ montoUsd: 2229, tasa: 575, montoCupResultante: 1281675, modalidad: "TASA" });
    expect(result.deudaFinalCup).toBe(150582);
    expect(result.valid).toBe(true);
  });

  it("parses a simple cuadre", () => {
    const text = `🚩 🅸🅽🅸🅲🅸🅾 📖 
       $ 67.879 deuda

🪎 🅟🅐🅶🅐🅳🅞 
       $ 900,000

🇺🇲 🆃🅸🆁🅰🅳🅞 🇲🇽
           438 x 565
         2139 x 570

🚩 🅵🅸🅽🅰🅻 📕
       $ 634.579 deuda`;

    const result = parseWhatsAppText(text);

    expect(result.deudaInicialCup).toBe(67879);
    expect(result.pagadoCup).toBe(900000);
    expect(result.lineasTirado).toHaveLength(2);
    expect(result.deudaFinalCup).toBe(634579);
    expect(result.valid).toBe(true);
  });

  it("reports invalid when calculated doesnt match final", () => {
    const text = `🚩 🅸🅽🅸🅲🅸🅾 📖 
       $ 100 deuda
🇺🇲 🆃🅸🆁🅰🅳🅞 🇲🇽
           100 x 500
🚩 🅵🅸🅽🅰🅻 📕
       $ 999 deuda`;

    const result = parseWhatsAppText(text);
    expect(result.valid).toBe(false);
  });
});
