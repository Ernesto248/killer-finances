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
  const lines = text.split("\n");

  let deudaInicialCup = 0;
  let pagadoCup = 0;
  const lineasTirado: ParsedLinea[] = [];
  let deudaFinalCup = 0;

  let section: "ini" | "pag" | "pen" | "tir" | "fin" | "none" = "ini";
  let inicioSeen = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip the @Name signature line
    if (line.startsWith("@") || line.includes("RECTIFICAR")) continue;

    // Detect section by emoji markers on the RAW line
    if (line.includes("🚩")) {
      if (!inicioSeen) {
        section = "ini";
        inicioSeen = true;
      } else {
        section = "fin";
      }
      continue;
    }

    if (line.includes("🪎")) {
      section = "pag";
      continue;
    }

    if (line.includes("🇺🇲")) {
      section = "tir";
      continue;
    }

    if (line.includes("📌")) {
      section = "pen";
      continue;
    }

    // Extract numbers from the line
    if (section === "ini") {
      const num = extractNumber(line);
      if (num > 0 && num < 100000000) deudaInicialCup = num;
      continue;
    }

    if (section === "pag") {
      const num = extractNumber(line);
      if (num > 0) pagadoCup += num;
      continue;
    }

    if (section === "pen") {
      // Skip pendientes completely
      continue;
    }

    if (section === "tir") {
      const num = extractNumber(line);
      if (num > 0) {
        // Look for "number × number" pattern
        const parts = line.split(/[×x*]/);
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
      continue;
    }

    if (section === "fin") {
      const num = extractNumber(line);
      if (num > 0 && num < 100000000) deudaFinalCup = num;
      continue;
    }
  }

  const totalZelleUsd = lineasTirado.reduce((s, l) => s + l.montoUsd, 0);
  const tasaPromedioCup = totalZelleUsd > 0
    ? Math.round((lineasTirado.reduce((s, l) => s + l.montoUsd * l.tasa, 0) / totalZelleUsd) * 100) / 100
    : 0;

  const deudaCalculada = deudaInicialCup - pagadoCup +
    lineasTirado.reduce((s, l) => s + l.montoCupResultante, 0);

  const absDiff = Math.abs(Math.abs(deudaCalculada) - Math.abs(deudaFinalCup));
  const valid = absDiff <= 1;

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
