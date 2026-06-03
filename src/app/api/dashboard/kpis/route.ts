import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function sum(arr: any[], field: string): number {
  return arr.reduce((s, r) => s + Number(r[field]), 0);
}

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const wiresWhere = (from || to) ? { fecha: dateFilter } : {};
    const reventasWhere = (from || to) ? { fecha: dateFilter } : {};
    const cuadresWhere = (from || to) ? { fecha: dateFilter } : {};

    const [
      balanceBancosUsdData, balanceEfectivoUsdData, balanceBancosCupData, balanceEfectivoCupData,
      gananciaCupWiresData, gananciaCupReventasData,
      totalRemeseros, remeserosActivos, wiresPendientes,
    ] = await Promise.all([
      prisma.cuentaBancaria.findMany({ where: { moneda: "USD", tipo: { in: ["ZELLE", "BANCO"] } }, select: { saldoActual: true } }),
      prisma.cuentaBancaria.findMany({ where: { moneda: "USD", tipo: "EFECTIVO" }, select: { saldoActual: true } }),
      prisma.cuentaBancaria.findMany({ where: { moneda: "CUP", tipo: { in: ["ZELLE", "BANCO"] } }, select: { saldoActual: true } }),
      prisma.cuentaBancaria.findMany({ where: { moneda: "CUP", tipo: "EFECTIVO" }, select: { saldoActual: true } }),
      prisma.wire.findMany({ where: wiresWhere, select: { gananciaCup: true } }),
      prisma.reventaWire.findMany({ where: reventasWhere, select: { gananciaCup: true } }),
      prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
      prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
      prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    ]);

    const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

    const lineasCuadre = await prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } });
    let tasaAdquisicion = 0;
    let totalUsdCuadres = 0;
    for (const l of lineasCuadre) {
      const monto = Number(l.montoUsd);
      const tasa = Number(l.tasa);
      tasaAdquisicion += monto * tasa;
      totalUsdCuadres += monto;
    }
    tasaAdquisicion = totalUsdCuadres > 0 ? Math.round(tasaAdquisicion / totalUsdCuadres) : 0;

    const balanceBancosUsd = sum(balanceBancosUsdData, "saldoActual");
    const balanceEfectivoUsd = sum(balanceEfectivoUsdData, "saldoActual");
    const balanceBancosCup = sum(balanceBancosCupData, "saldoActual");
    const balanceEfectivoCup = sum(balanceEfectivoCupData, "saldoActual");

    return NextResponse.json({
      balanceBancosUsd,
      balanceEfectivoUsd,
      balanceBancosCup,
      balanceEfectivoCup,
      balanceUsd: balanceBancosUsd + balanceEfectivoUsd,
      balanceCup: balanceBancosCup + balanceEfectivoCup,
      gananciaCup: sum(gananciaCupWiresData, "gananciaCup") + sum(gananciaCupReventasData, "gananciaCup"),
      remeserosActivos,
      totalRemeseros,
      wiresPendientes: wiresPendientes.length,
      wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
      tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
      tasaAdquisicion,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (err.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
