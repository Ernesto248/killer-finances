import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateFilter = { gte: startOfMonth, lte: now };

  const [
    balanceBancosUsd,
    balanceEfectivoUsd,
    balanceBancosCup,
    balanceEfectivoCup,
    gananciaCupWires,
    gananciaCupReventas,
    remeserosActivos,
    totalRemeseros,
    wiresPendientes,
    config,
    lineasCuadre,
  ] = await Promise.all([
    prisma.cuentaBancaria.aggregate({ where: { moneda: "USD", tipo: { in: ["ZELLE", "BANCO"] } }, _sum: { saldoActual: true } }),
    prisma.cuentaBancaria.aggregate({ where: { moneda: "USD", tipo: "EFECTIVO" }, _sum: { saldoActual: true } }),
    prisma.cuentaBancaria.aggregate({ where: { moneda: "CUP", tipo: { in: ["ZELLE", "BANCO"] } }, _sum: { saldoActual: true } }),
    prisma.cuentaBancaria.aggregate({ where: { moneda: "CUP", tipo: "EFECTIVO" }, _sum: { saldoActual: true } }),
    prisma.wire.aggregate({ where: { fecha: dateFilter }, _sum: { gananciaCup: true } }),
    prisma.reventaWire.aggregate({ where: { fecha: dateFilter }, _sum: { gananciaCup: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
    prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
    prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } }),
  ]);

  // Calculate weighted average acquisition rate
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
        balanceBancosUsd: Number(balanceBancosUsd._sum.saldoActual ?? 0),
        balanceEfectivoUsd: Number(balanceEfectivoUsd._sum.saldoActual ?? 0),
        balanceBancosCup: Number(balanceBancosCup._sum.saldoActual ?? 0),
        balanceEfectivoCup: Number(balanceEfectivoCup._sum.saldoActual ?? 0),
        balanceUsd: Number(balanceBancosUsd._sum.saldoActual ?? 0) + Number(balanceEfectivoUsd._sum.saldoActual ?? 0),
        balanceCup: Number(balanceBancosCup._sum.saldoActual ?? 0) + Number(balanceEfectivoCup._sum.saldoActual ?? 0),
        gananciaCup: Number(gananciaCupWires._sum.gananciaCup ?? 0) + Number(gananciaCupReventas._sum.gananciaCup ?? 0),
        remeserosActivos,
        totalRemeseros,
        wiresPendientesCount: wiresPendientes.length,
        wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
        tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
        tasaAdquisicion,
      }}
    />
  );
}
