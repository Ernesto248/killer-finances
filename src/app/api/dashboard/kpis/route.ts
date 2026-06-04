import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");

    const cuentas = await prisma.$queryRawUnsafe<Array<{ moneda: string; tipo: string; saldo_actual: number }>>(
      `SELECT moneda, tipo, saldo_actual FROM cuentas_bancarias`
    );

    const balanceBancosUsd = cuentas.filter(c => c.moneda === "USD" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldo_actual), 0);
    const balanceEfectivoUsd = cuentas.filter(c => c.moneda === "USD" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldo_actual), 0);
    const balanceBancosCup = cuentas.filter(c => c.moneda === "CUP" && (c.tipo === "ZELLE" || c.tipo === "BANCO")).reduce((s, c) => s + Number(c.saldo_actual), 0);
    const balanceEfectivoCup = cuentas.filter(c => c.moneda === "CUP" && c.tipo === "EFECTIVO").reduce((s, c) => s + Number(c.saldo_actual), 0);

    const [wiresGanancia, reventasGanancia, totalRemeseros, remeserosActivos, wiresPendientes, config, lineasCuadre] =
      await Promise.all([
        prisma.wire.findMany({ select: { gananciaCup: true } }),
        prisma.reventaWire.findMany({ select: { gananciaCup: true } }),
        prisma.persona.count({ where: { tipo: { contains: "REMESERO" } } }),
        prisma.persona.count({ where: { tipo: { contains: "REMESERO" }, activo: true } }),
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
