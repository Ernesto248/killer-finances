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

    const cuadre = await withRetry(
      () => prisma.cuadre.findUnique({
        where: { id: params.id },
        include: { lineas: true },
      }),
      { label: "cuadres.revert.find" }
    );

    if (!cuadre) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.$transaction([
      withRetry(
        () => prisma.lineaCuadre.deleteMany({ where: { cuadreId: cuadre.id } }),
        { label: "cuadres.revert.deleteLineas" }
      ),
      withRetry(
        () => prisma.cuadre.delete({ where: { id: cuadre.id } }),
        { label: "cuadres.revert.deleteCuadre" }
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (err.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (err.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
