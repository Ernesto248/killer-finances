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

    // Use raw SQL for balance revert (Prisma 7 decrement broken on Decimal)
    const personaActual = await prisma.$queryRawUnsafe<Array<{ balance_cup: number; balance_usd: number }>>(
      `SELECT balance_cup, balance_usd FROM personas WHERE id = $1`,
      cuadre.personaId
    );
    if (personaActual.length > 0) {
      const newCup = Number(personaActual[0].balance_cup) - cupChange;
      const newUsd = Number(personaActual[0].balance_usd) - totalZelle;
      await prisma.$executeRawUnsafe(
        `UPDATE personas SET balance_cup = $1, balance_usd = $2 WHERE id = $3`,
        newCup, newUsd, cuadre.personaId
      );
    }

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
