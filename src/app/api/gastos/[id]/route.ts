import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { gastoSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = gastoSchema.parse(body);

    const gasto = await prisma.gasto.update({
      where: { id: params.id },
      data: {
        monto: data.monto,
        moneda: data.moneda,
        categoria: data.categoria,
        descripcion: data.descripcion ?? null,
        loteId: data.loteId ?? null,
      },
      include: {
        lote: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json(gasto);
  } catch (error: unknown) {
    const err = error as Error & { errors?: unknown; name?: string; code?: string };
    if (err.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos invalidos", details: (err as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN");

    await prisma.gasto.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
