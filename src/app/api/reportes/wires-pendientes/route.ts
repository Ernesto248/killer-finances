import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");

    const wires = await withRetry(
      () =>
        prisma.wire.findMany({
          where: { estado: { not: "PAGADO" } },
          orderBy: { fecha: "desc" },
          select: {
            id: true,
            compradorId: true,
            fecha: true,
            montoUsd: true,
            tasaPactada: true,
            montoCupTotal: true,
            montoPagadoCup: true,
            monedaPago: true,
            porcentajeComision: true,
            gananciaCup: true,
            estado: true,
            createdAt: true,
            updatedAt: true,
            comprador: { select: { id: true, nombre: true } },
          },
        }),
      { label: "wiresPendientes.list" }
    );

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
