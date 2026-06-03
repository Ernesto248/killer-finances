import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");

    const wires = await prisma.wire.findMany({
      where: { estado: { not: "PAGADO" } },
      orderBy: { fecha: "desc" },
      include: {
        comprador: {
          select: { id: true, nombre: true },
        },
      },
    });

    const result = wires.map((w) => ({
      ...w,
      montoUsd: Number(w.montoUsd),
      tasaPactada: Number(w.tasaPactada),
      montoCupTotal: Number(w.montoCupTotal),
      montoPagadoCup: Number(w.montoPagadoCup),
      gananciaCup: Number(w.gananciaCup),
      porcentajeComision: w.porcentajeComision ? Number(w.porcentajeComision) : null,
      pendiente: Number(w.montoCupTotal) - Number(w.montoPagadoCup),
    }));

    return NextResponse.json(result);
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
