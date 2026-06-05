import "server-only";

import { prisma } from "./prisma";
import { withRetry } from "./db-retry";

const CUADRE_LIST_SELECT = {
  id: true,
  personaId: true,
  fecha: true,
  nota: true,
  deudaInicialCup: true,
  pagadoCup: true,
  deudaFinalCup: true,
  totalZelleUsd: true,
  tasaPromedioCup: true,
  previousBalanceCup: true,
  previousBalanceUsd: true,
  persona: { select: { id: true, nombre: true, alias: true } },
  lineas: {
    select: {
      id: true,
      montoUsd: true,
      tasa: true,
      modalidad: true,
      porcentajeComision: true,
      montoCupResultante: true,
      gananciaUsd: true,
    },
  },
} as const;

export function mapRawCuadres(raw: Array<Record<string, unknown>>) {
  const byId = new Map<string, Record<string, unknown> & { lineas: unknown[] }>();
  for (const r of raw) {
    const id = String(r.id);
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        personaId: r.persona_id,
        fecha: r.fecha,
        nota: r.nota,
        deudaInicialCup: r.deuda_inicial_cup,
        pagadoCup: r.pagado_cup,
        deudaFinalCup: r.deuda_final_cup,
        totalZelleUsd: r.total_zelle_usd,
        tasaPromedioCup: r.tasa_promedio_cup,
        previousBalanceCup: r.previous_balance_cup,
        previousBalanceUsd: r.previous_balance_usd,
        persona: {
          id: r.persona_id_r,
          nombre: r.persona_nombre,
          alias: r.persona_alias,
        },
        lineas: [],
      });
    }
    if (r.linea_id) {
      byId.get(id)!.lineas.push({
        id: r.linea_id,
        montoUsd: r.monto_usd,
        tasa: r.tasa,
        modalidad: r.modalidad,
        porcentajeComision: r.porcentaje_comision,
        montoCupResultante: r.monto_cup_resultante,
        gananciaUsd: r.ganancia_usd,
      });
    }
  }
  return Array.from(byId.values());
}

export async function safeFindCuadres() {
  try {
    return await withRetry(
      () =>
        prisma.cuadre.findMany({
          orderBy: { fecha: "desc" },
          select: CUADRE_LIST_SELECT,
        }),
      { label: "safeFindCuadres" }
    );
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT
            c.id, c.persona_id, c.fecha, c.nota,
            c.deuda_inicial_cup, c.pagado_cup, c.deuda_final_cup,
            c.total_zelle_usd, c.tasa_promedio_cup,
            c.previous_balance_cup, c.previous_balance_usd,
            p.id AS persona_id_r, p.nombre AS persona_nombre, p.alias AS persona_alias,
            l.id AS linea_id, l.monto_usd, l.tasa, l.modalidad,
            l.porcentaje_comision, l.monto_cup_resultante, l.ganancia_usd
          FROM cuadres c
          LEFT JOIN personas p ON p.id = c.persona_id
          LEFT JOIN lineas_cuadre l ON l.cuadre_id = c.id
          ORDER BY c.fecha DESC
        `,
        { label: "safeFindCuadres.raw" }
      );
      return mapRawCuadres(raw);
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeFindCuadres failed", { primaryCode, fallbackCode });
      return [];
    }
  }
}
