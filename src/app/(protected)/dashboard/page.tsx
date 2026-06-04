import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateFilter = { gte: startOfMonth, lte: now };

  // Use findMany without complex filters, sum in JS
  const cuentas = await prisma.cuentaBancaria.findMany();
  const wiresGanancia = await prisma.wire.findMany({ select: { gananciaCup: true }, where: { fecha: dateFilter } });
  const reventasGanancia = await prisma.reventaWire.findMany({ select: { gananciaCup: true }, where: { fecha: dateFilter } });
  const remeserosActivos = await prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } });
  const totalRemeseros = await prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } });
  const wiresPendientes = await prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } });
  const config = await prisma.configuracion.findUnique({ where: { id: "global" } });
  const lineasCuadre = await prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } });

  // Sum balances in JS
  const balanceBancosUsd = cuentas.filter(c => c.moneda === "USD" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoUsd = cuentas.filter(c => c.moneda === "USD" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceBancosCup = cuentas.filter(c => c.moneda === "CUP" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoCup = cuentas.filter(c => c.moneda === "CUP" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);

  const gananciaCup = wiresGanancia.reduce((s, w) => s + Number(w.gananciaCup), 0) +
    reventasGanancia.reduce((s, r) => s + Number(r.gananciaCup), 0);

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
        wiresPendientesCount: wiresPendientes.length,
        wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
        tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
        tasaAdquisicion,
      }}
    />
  );
}
