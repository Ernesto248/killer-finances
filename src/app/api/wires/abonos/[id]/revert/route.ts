import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");

    const abono = await withRetry(
      () => prisma.abonoWire.findUnique({
        where: { id: params.id },
        include: { wire: true },
      }),
      { label: "wires.abono.revert.find" }
    );

    if (!abono) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const monto = Number(abono.monto);
    const nuevoPagado = Number(abono.wire.montoPagadoCup) - monto;
    const nuevoEstado =
      nuevoPagado <= 0 ? "PENDIENTE" : nuevoPagado >= Number(abono.wire.montoCupTotal) ? "PAGADO" : "PARCIAL";

    await prisma.$transaction([
      withRetry(
        () => prisma.persona.update({
          where: { id: abono.wire.compradorId },
          data: { balanceCup: { increment: monto } },
        }),
        { label: "wires.abono.revert.persona" }
      ),
      withRetry(
        () => prisma.wire.update({
          where: { id: abono.wire.id },
          data: { montoPagadoCup: nuevoPagado, estado: nuevoEstado },
        }),
        { label: "wires.abono.revert.wire" }
      ),
      withRetry(
        () => prisma.abonoWire.delete({ where: { id: abono.id } }),
        { label: "wires.abono.revert.deleteAbono" }
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (error.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
