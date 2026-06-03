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
    cuentasUsd,
    cuentasCup,
    gananciaCupWires,
    gananciaCupReventas,
    remeserosActivos,
    totalRemeseros,
    wiresPendientes,
    config,
  ] = await Promise.all([
    prisma.cuentaBancaria.aggregate({ where: { moneda: "USD" }, _sum: { saldoActual: true } }),
    prisma.cuentaBancaria.aggregate({ where: { moneda: "CUP" }, _sum: { saldoActual: true } }),
    prisma.wire.aggregate({ where: { fecha: dateFilter }, _sum: { gananciaCup: true } }),
    prisma.reventaWire.aggregate({ where: { fecha: dateFilter }, _sum: { gananciaCup: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
    prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
    prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
  ]);

  return (
    <DashboardClient
      initialData={{
        balanceUsd: Number(cuentasUsd._sum.saldoActual ?? 0),
        balanceCup: Number(cuentasCup._sum.saldoActual ?? 0),
        gananciaCup: Number(gananciaCupWires._sum.gananciaCup ?? 0) + Number(gananciaCupReventas._sum.gananciaCup ?? 0),
        remeserosActivos,
        totalRemeseros,
        wiresPendientesCount: wiresPendientes.length,
        wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
        tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
      }}
    />
  );
}
