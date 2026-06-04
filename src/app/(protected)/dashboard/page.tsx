import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();

  const cuentas = await prisma.cuentaBancaria.findMany();

  const balanceBancosUsd = cuentas.filter(c => c.moneda === "USD" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoUsd = cuentas.filter(c => c.moneda === "USD" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceBancosCup = cuentas.filter(c => c.moneda === "CUP" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
  const balanceEfectivoCup = cuentas.filter(c => c.moneda === "CUP" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);

  const [
    wiresGanancia,
    reventasGanancia,
    remeserosActivos,
    totalRemeseros,
    wiresPendientes,
    config,
    lineasCuadre,
  ] = await Promise.all([
    prisma.wire.findMany({ select: { gananciaCup: true } }),
    prisma.reventaWire.findMany({ select: { gananciaCup: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
    prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
    prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } }),
  ]);

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
