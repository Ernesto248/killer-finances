import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : now.getMonth() + 1;
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    to.setHours(23, 59, 59, 999);

    const [gananciaWiresData, gananciaReventasData, gananciaComisionesData, totalWires, totalReventas] =
      await Promise.all([
        withRetry(() => prisma.wire.findMany({ where: { fecha: { gte: from, lte: to } }, select: { gananciaCup: true } }), { label: "ganancias.wires" }),
        withRetry(() => prisma.reventaWire.findMany({ where: { fecha: { gte: from, lte: to } }, select: { gananciaCup: true } }), { label: "ganancias.reventas" }),
        withRetry(() => prisma.lineaCuadre.findMany({ where: { cuadre: { fecha: { gte: from, lte: to } } }, select: { gananciaUsd: true } }), { label: "ganancias.comisiones" }),
        withRetry(() => prisma.wire.count({ where: { fecha: { gte: from, lte: to } } }), { label: "ganancias.countWires" }),
        withRetry(() => prisma.reventaWire.count({ where: { fecha: { gte: from, lte: to } } }), { label: "ganancias.countReventas" }),
      ]);

    const periodo = `${year}-${String(month).padStart(2, "0")}`;

    return NextResponse.json({
      gananciaWiresCup: gananciaWiresData.reduce((s, r) => s + Number(r.gananciaCup), 0),
      gananciaReventasCup: gananciaReventasData.reduce((s, r) => s + Number(r.gananciaCup), 0),
      gananciaComisionesUsd: gananciaComisionesData.reduce((s, r) => s + Number(r.gananciaUsd), 0),
      totalWires,
      totalReventas,
      periodo,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (err.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
