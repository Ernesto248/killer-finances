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
    const hasFilter = from || to;

    const wiresWhere = hasFilter ? { fecha: dateFilter } : {};
    const reventasWhere = hasFilter ? { fecha: dateFilter } : {};

    const cuentas = await prisma.cuentaBancaria.findMany();
    const wiresGanancia = await prisma.wire.findMany({ select: { gananciaCup: true }, where: wiresWhere });
    const reventasGanancia = await prisma.reventaWire.findMany({ select: { gananciaCup: true }, where: reventasWhere });
    const totalRemeseros = await prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } });
    const remeserosActivos = await prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } });
    const wiresPendientes = await prisma.wire.findMany({ where: { estado: { not: "PAGADO" } }, select: { montoUsd: true } });
    const config = await prisma.configuracion.findUnique({ where: { id: "global" } });
    const lineasCuadre = await prisma.lineaCuadre.findMany({ select: { montoUsd: true, tasa: true } });

    const balanceBancosUsd = cuentas.filter(c => c.moneda === "USD" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
    const balanceEfectivoUsd = cuentas.filter(c => c.moneda === "USD" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);
    const balanceBancosCup = cuentas.filter(c => c.moneda === "CUP" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldoActual), 0);
    const balanceEfectivoCup = cuentas.filter(c => c.moneda === "CUP" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldoActual), 0);

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
      balanceBancosUsd,
      balanceEfectivoUsd,
      balanceBancosCup,
      balanceEfectivoCup,
      balanceUsd: balanceBancosUsd + balanceEfectivoUsd,
      balanceCup: balanceBancosCup + balanceEfectivoCup,
      gananciaCup: wiresGanancia.reduce((s, w) => s + Number(w.gananciaCup), 0) + reventasGanancia.reduce((s, r) => s + Number(r.gananciaCup), 0),
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
