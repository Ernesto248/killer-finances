import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

function sum(arr: { saldoActual: any }[]): number {
  return arr.reduce((s, r) => s + Number(r.saldoActual), 0);
}

function sumG(arr: { gananciaCup: any }[]): number {
  return arr.reduce((s, r) => s + Number(r.gananciaCup), 0);
}

export default async function DashboardPage() {
  await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateFilter = { gte: startOfMonth, lte: now };

  const [
    balanceBancosUsdData,
    balanceEfectivoUsdData,
    balanceBancosCupData,
    balanceEfectivoCupData,
    gananciaCupWiresData,
    gananciaCupReventasData,
    remeserosActivos,
    totalRemeseros,
    wiresPendientes,
    config,
    lineasCuadre,
  ] = await Promise.all([
    prisma.cuentaBancaria.findMany({ where: { moneda: "USD", tipo: { in: ["ZELLE", "BANCO"] } }, select: { saldoActual: true } }),
    prisma.cuentaBancaria.findMany({ where: { moneda: "USD", tipo: "EFECTIVO" }, select: { saldoActual: true } }),
    prisma.cuentaBancaria.findMany({ where: { moneda: "CUP", tipo: { in: ["ZELLE", "BANCO"] } }, select: { saldoActual: true } }),
    prisma.cuentaBancaria.findMany({ where: { moneda: "CUP", tipo: "EFECTIVO" }, select: { saldoActual: true } }),
    prisma.wire.findMany({ where: { fecha: dateFilter }, select: { gananciaCup: true } }),
    prisma.reventaWire.findMany({ where: { fecha: dateFilter }, select: { gananciaCup: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
    prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
    prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } }),
  ]);

  let tasaAdquisicion = 0;
  let totalUsdCuadres = 0;
  for (const l of lineasCuadre) {
    const monto = Number(l.montoUsd);
    const tasa = Number(l.tasa);
    tasaAdquisicion += monto * tasa;
    totalUsdCuadres += monto;
  }
  tasaAdquisicion = totalUsdCuadres > 0 ? Math.round(tasaAdquisicion / totalUsdCuadres) : 0;

  const balanceBancosUsd = sum(balanceBancosUsdData);
  const balanceEfectivoUsd = sum(balanceEfectivoUsdData);
  const balanceBancosCup = sum(balanceBancosCupData);
  const balanceEfectivoCup = sum(balanceEfectivoCupData);
  const gananciaCup = sumG(gananciaCupWiresData) + sumG(gananciaCupReventasData);

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
        wiresPendientesCount: wiresPendientes.length,
        wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
        tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
        tasaAdquisicion,
      }}
    />
  );
}
