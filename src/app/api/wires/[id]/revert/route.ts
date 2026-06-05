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

    const wire = await withRetry(
      () => prisma.wire.findUnique({
        where: { id: params.id },
        include: { abonos: true },
      }),
      { label: "wires.revert.find" }
    );

    if (!wire) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const totalAbonos = wire.abonos.reduce((s, a) => s + Number(a.monto), 0);

    await prisma.$transaction([
      withRetry(
        () => prisma.persona.update({
          where: { id: wire.compradorId },
          data: { balanceCup: { decrement: Number(wire.montoCupTotal) - totalAbonos } },
        }),
        { label: "wires.revert.persona" }
      ),
      withRetry(
        () => prisma.abonoWire.deleteMany({ where: { wireId: wire.id } }),
        { label: "wires.revert.deleteAbonos" }
      ),
      withRetry(
        () => prisma.wire.delete({ where: { id: wire.id } }),
        { label: "wires.revert.deleteWire" }
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
