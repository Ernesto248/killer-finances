import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDateFilter = from || to;

    const whereCuadre = hasDateFilter ? { fecha: dateFilter } : {};
    const whereWire = hasDateFilter ? { fecha: dateFilter } : {};
    const whereReventa = hasDateFilter ? { fecha: dateFilter } : {};

    const [balanceBancosUsd, balanceEfectivoUsd, balanceBancosCup, balanceEfectivoCup,
           gananciaCupWires, gananciaCupReventas, gananciaUsdCuadres,
           totalRemeseros, remeserosActivos, wiresPendientes] = await Promise.all([
      prisma.cuentaBancaria.aggregate({ where: { moneda: "USD", tipo: { in: ["ZELLE", "BANCO"] } }, _sum: { saldoActual: true } }),
      prisma.cuentaBancaria.aggregate({ where: { moneda: "USD", tipo: "EFECTIVO" }, _sum: { saldoActual: true } }),
      prisma.cuentaBancaria.aggregate({ where: { moneda: "CUP", tipo: { in: ["ZELLE", "BANCO"] } }, _sum: { saldoActual: true } }),
      prisma.cuentaBancaria.aggregate({ where: { moneda: "CUP", tipo: "EFECTIVO" }, _sum: { saldoActual: true } }),
      prisma.wire.aggregate({ where: whereWire, _sum: { gananciaCup: true } }),
      prisma.reventaWire.aggregate({ where: whereReventa, _sum: { gananciaCup: true } }),
      prisma.lineaCuadre.aggregate({ where: { cuadre: whereCuadre }, _sum: { gananciaUsd: true } }),
      prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
      prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
      prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } }),
    ]);

    const config = await prisma.configuracion.findUnique({ where: { id: "global" } });

    // Calculate tasa de adquisicion (weighted average from all cuadre lineas)
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

    return NextResponse.json({
      balanceBancosUsd: Number(balanceBancosUsd._sum.saldoActual ?? 0),
      balanceEfectivoUsd: Number(balanceEfectivoUsd._sum.saldoActual ?? 0),
      balanceBancosCup: Number(balanceBancosCup._sum.saldoActual ?? 0),
      balanceEfectivoCup: Number(balanceEfectivoCup._sum.saldoActual ?? 0),
      balanceUsd: Number(balanceBancosUsd._sum.saldoActual ?? 0) + Number(balanceEfectivoUsd._sum.saldoActual ?? 0),
      balanceCup: Number(balanceBancosCup._sum.saldoActual ?? 0) + Number(balanceEfectivoCup._sum.saldoActual ?? 0),
      gananciaCup: Number(gananciaCupWires._sum.gananciaCup ?? 0) + Number(gananciaCupReventas._sum.gananciaCup ?? 0),
      gananciaUsd: Number(gananciaUsdCuadres._sum.gananciaUsd ?? 0),
      remeserosActivos,
      totalRemeseros,
      wiresPendientes: wiresPendientes.length,
      wiresPendientesUsd: wiresPendientes.reduce((s, w) => s + Number(w.montoUsd), 0),
      tasaGlobal: Number(config?.tasaUsdGlobal ?? 600),
      tasaAdquisicion,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
