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
    const cupChange = Number(cuadre.deudaFinalCup) - Number(cuadre.deudaInicialCup) + Number(cuadre.pagadoCup);

    await prisma.$transaction([
      // Revert persona balances
      prisma.persona.update({
        where: { id: cuadre.personaId },
        data: {
          balanceCup: { decrement: cupChange },
          balanceUsd: { decrement: totalZelle },
        },
      }),
      // Delete lineas
      prisma.lineaCuadre.deleteMany({ where: { cuadreId: cuadre.id } }),
      // Delete cuadre
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
