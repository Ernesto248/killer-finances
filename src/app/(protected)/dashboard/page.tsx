import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeFindCuentas } from "@/lib/cuentas-helpers";
import { withRetry } from "@/lib/db-retry";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

interface DashboardKpisRow {
  wires_total_ganancia: string | null;
  reventas_total_ganancia: string | null;
  remeseros_activos: bigint | number | null;
  remeseros_total: bigint | number | null;
  wires_pendientes_count: bigint | number | null;
  wires_pendientes_usd: string | null;
  config_tasa: string | null;
}

async function safeQuery<T>(
  label: string,
  query: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await withRetry(query, {
      label,
      onRetry: ({ attempt, code, delayMs }) =>
        console.warn(`dashboard query retry [${label}]`, { attempt, code, delayMs }),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    console.error(`dashboard query failed [${label}]`, { code });
    return fallback;
  }
}

export default async function DashboardPage() {
  await requireAuth();

  const [cuentas, kpisRows, lineasCuadre] = await Promise.all([
    safeFindCuentas(),
    safeQuery<DashboardKpisRow[]>(
      "dashboard.kpis",
      () =>
        prisma.$queryRaw<DashboardKpisRow[]>`
          SELECT
            (SELECT COALESCE(SUM(ganancia_cup), 0) FROM wires) AS wires_total_ganancia,
            (SELECT COALESCE(SUM(ganancia_cup), 0) FROM reventas_wire) AS reventas_total_ganancia,
            (SELECT COUNT(*)::bigint FROM personas WHERE tipo LIKE '%REMESERO%' AND activo) AS remeseros_activos,
            (SELECT COUNT(*)::bigint FROM personas WHERE tipo LIKE '%REMESERO%') AS remeseros_total,
            (SELECT COUNT(*)::bigint FROM wires WHERE estado <> 'PAGADO') AS wires_pendientes_count,
            (SELECT COALESCE(SUM(monto_usd), 0) FROM wires WHERE estado <> 'PAGADO') AS wires_pendientes_usd,
            (SELECT tasa_usd_global::text FROM configuracion WHERE id = 'global') AS config_tasa
        `,
      [] as DashboardKpisRow[]
    ),
    safeQuery(
      "dashboard.tasaAdq",
      () => prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } }),
      [] as Array<{ montoUsd: unknown; tasa: unknown }>
    ),
  ]);

  const balanceBancosUsd = cuentas.filter(c => c.moneda === "USD" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoUsd = cuentas.filter(c => c.moneda === "USD" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceBancosCup = cuentas.filter(c => c.moneda === "CUP" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoCup = cuentas.filter(c => c.moneda === "CUP" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);

  const kpi = kpisRows[0] ?? ({} as DashboardKpisRow);
  const gananciaCup = Number(kpi.wires_total_ganancia ?? 0) + Number(kpi.reventas_total_ganancia ?? 0);
  const remeserosActivos = Number(kpi.remeseros_activos ?? 0);
  const totalRemeseros = Number(kpi.remeseros_total ?? 0);
  const wiresPendientesCount = Number(kpi.wires_pendientes_count ?? 0);
  const wiresPendientesUsd = Number(kpi.wires_pendientes_usd ?? 0);
  const tasaGlobal = Number(kpi.config_tasa ?? 600);

  let tasaAdquisicion = 0;
  let totalUsdCuadres = 0;
  for (const l of lineasCuadre) {
    const monto = Number(l.montoUsd);
    const tasa = Number(l.tasa);
    tasaAdquisicion += monto * tasa;
    totalUsdCuadres += monto;
  }
  tasaAdquisicion = totalUsdCuadres > 0 ? Math.round(tasaAdquisicion / totalUsdCuadres) : 0;

  return (
    <DashboardClient
      initialData={{
        balanceBancosUsd,
        balanceEfectivoUsd,
        balanceBancosCup,
        balanceEfectivoCup,
        balanceUsd: balanceBancosUsd + balanceEfectivoUsd,
        balanceCup: balanceBancosCup + balanceEfectivoCup,
        gananciaCup,
        remeserosActivos,
        totalRemeseros,
        wiresPendientesCount,
        wiresPendientesUsd,
        tasaGlobal,
        tasaAdquisicion,
      }}
    />
  );
}
