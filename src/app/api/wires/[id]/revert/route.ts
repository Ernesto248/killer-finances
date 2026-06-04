import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");

    const wire = await prisma.wire.findUnique({
      where: { id: params.id },
      include: { abonos: true },
    });

    if (!wire) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const totalAbonos = wire.abonos.reduce((s, a) => s + Number(a.monto), 0);

    await prisma.$transaction([
      // Revert comprador balance (they no longer owe CUP)
      prisma.persona.update({
        where: { id: wire.compradorId },
        data: { balanceCup: { decrement: Number(wire.montoCupTotal) - totalAbonos } },
      }),
      // Delete all abonos
      prisma.abonoWire.deleteMany({ where: { wireId: wire.id } }),
      // Delete the wire
      prisma.wire.delete({ where: { id: wire.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (error.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
