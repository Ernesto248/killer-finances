import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");

    const cuadre = await prisma.cuadre.findUnique({
      where: { id: params.id },
      include: { lineas: true },
    });

    if (!cuadre) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const totalZelle = Number(cuadre.totalZelleUsd);

    // Revert: balanceCup back to initial, balanceUsd decremented
    const persona = await prisma.persona.findUnique({ where: { id: cuadre.personaId }, select: { balanceUsd: true } });
    await prisma.persona.update({
      where: { id: cuadre.personaId },
      data: {
        balanceCup: cuadre.deudaInicialCup,
        balanceUsd: Math.max(0, Number(persona?.balanceUsd ?? 0) - totalZelle),
      },
    });

    await prisma.$transaction([
      prisma.lineaCuadre.deleteMany({ where: { cuadreId: cuadre.id } }),
      prisma.cuadre.delete({ where: { id: cuadre.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (error.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (error.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
