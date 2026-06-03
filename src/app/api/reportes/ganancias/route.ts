import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!, 10)
      : now.getMonth() + 1;

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    to.setHours(23, 59, 59, 999);

    const [gananciaWires, gananciaReventas, gananciaComisiones, totalWires, totalReventas] =
      await Promise.all([
        prisma.wire.aggregate({
          where: { fecha: { gte: from, lte: to } },
          _sum: { gananciaCup: true },
        }),
        prisma.reventaWire.aggregate({
          where: { fecha: { gte: from, lte: to } },
          _sum: { gananciaCup: true },
        }),
        prisma.lineaCuadre.aggregate({
          where: { cuadre: { fecha: { gte: from, lte: to } } },
          _sum: { gananciaUsd: true },
        }),
        prisma.wire.count({
          where: { fecha: { gte: from, lte: to } },
        }),
        prisma.reventaWire.count({
          where: { fecha: { gte: from, lte: to } },
        }),
      ]);

    const periodo = `${year}-${String(month).padStart(2, "0")}`;

    return NextResponse.json({
      gananciaWiresCup: Number(gananciaWires._sum.gananciaCup ?? 0),
      gananciaReventasCup: Number(gananciaReventas._sum.gananciaCup ?? 0),
      gananciaComisionesUsd: Number(gananciaComisiones._sum.gananciaUsd ?? 0),
      totalWires,
      totalReventas,
      periodo,
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
