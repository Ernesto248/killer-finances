interface ParsedLinea {
  montoUsd: number;
  tasa: number;
  montoCupResultante: number;
  modalidad: "TASA";
}

interface ParsedCuadre {
  deudaInicialCup: number;
  pagadoCup: number;
  lineasTirado: ParsedLinea[];
  deudaFinalCup: number;
  totalZelleUsd: number;
  tasaPromedioCup: number;
  valid: boolean;
  error?: string;
}

export function parseWhatsAppText(text: string): ParsedCuadre {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let deudaInicialCup = 0;
  let pagadoCup = 0;
  const lineasTirado: ParsedLinea[] = [];
  let deudaFinalCup = 0;

  let section: "ini" | "pag" | "tir" | "fin" = "ini";

  for (const line of lines) {
    const clean = line.replace(/[🚩🪎🇺🇲📌📖📕🇲🇽*$#]/g, "").trim();

    if (clean.match(/inicio/i)) { section = "ini"; continue; }
    if (clean.match(/pagado/i)) { section = "pag"; continue; }
    if (clean.match(/tira[dt]o/i)) { section = "tir"; continue; }
    if (clean.match(/final/i)) { section = "fin"; continue; }
    if (clean.match(/pendiente/i)) { continue; }

    if (clean.match(/deuda/i)) {
      const num = extractNumber(clean);
      if (section === "ini") deudaInicialCup = num;
      if (section === "fin") deudaFinalCup = num;
      continue;
    }

    if (section === "pag") {
      const num = extractNumber(clean);
      if (num > 0) pagadoCup = num;
      continue;
    }

    if (section === "tir") {
      const parts = clean.split(/[×x*]/);
      if (parts.length >= 2) {
        const montoUsd = extractNumber(parts[0]);
        const tasa = extractNumber(parts[1]);
        if (montoUsd > 0 && tasa > 0) {
          lineasTirado.push({
            montoUsd,
            tasa,
            montoCupResultante: Math.round(montoUsd * tasa * 100) / 100,
            modalidad: "TASA",
          });
        }
      }
    }
  }

  const totalZelleUsd = lineasTirado.reduce((s, l) => s + l.montoUsd, 0);
  const tasaPromedioCup = totalZelleUsd > 0
    ? Math.round((lineasTirado.reduce((s, l) => s + l.montoUsd * l.tasa, 0) / totalZelleUsd) * 100) / 100
    : 0;

  const deudaCalculada = deudaInicialCup - pagadoCup +
    lineasTirado.reduce((s, l) => s + l.montoCupResultante, 0);

  const valid = Math.abs(deudaCalculada - deudaFinalCup) <= 1;

  return {
    deudaInicialCup,
    pagadoCup,
    lineasTirado,
    deudaFinalCup,
    totalZelleUsd,
    tasaPromedioCup,
    valid,
    error: valid ? undefined : `Diferencia: ${Math.abs(deudaCalculada - deudaFinalCup).toFixed(2)}`,
  };
}

function extractNumber(str: string): number {
  const cleaned = str.replace(/[^0-9.,]/g, "");
  if (!cleaned) return 0;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasComma && !hasDot) {
    const afterLastComma = cleaned.split(",").pop()!;
    if (afterLastComma.length <= 2) {
      return parseFloat(cleaned.replace(",", "."));
    }
    return parseFloat(cleaned.replace(/,/g, ""));
  }

  if (hasDot && !hasComma) {
    const afterLastDot = cleaned.split(".").pop()!;
    if (afterLastDot.length <= 2) {
      return parseFloat(cleaned);
    }
    return parseFloat(cleaned.replace(/\./g, ""));
  }

  if (hasDot && hasComma) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }

  return parseFloat(cleaned);
}

export type { ParsedCuadre, ParsedLinea };
