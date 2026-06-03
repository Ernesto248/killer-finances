import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { wireSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const wire = await prisma.wire.findUnique({
      where: { id: params.id },
      include: {
        comprador: true,
        abonos: {
          orderBy: { fecha: "desc" },
        },
      },
    });
    if (!wire) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(wire);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = wireSchema.parse(body);

    const existing = await prisma.wire.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const cuadres = await prisma.cuadre.findMany({
      select: { tasaPromedioCup: true },
      where: { tasaPromedioCup: { gt: 0 } },
    });
    const tasaPromedio = cuadres.length > 0
      ? cuadres.reduce((s, c) => s + Number(c.tasaPromedioCup), 0) / cuadres.length
      : 0;

    const montoCupTotal = Math.round(data.montoUsd * data.tasaPactada);
    const gananciaCup = Math.round(data.montoUsd * (data.tasaPactada - tasaPromedio));

    const previousMontoCupTotal = Number(existing.montoCupTotal);

    const [wire] = await prisma.$transaction([
      prisma.wire.update({
        where: { id: params.id },
        data: {
          compradorId: data.compradorId,
          montoUsd: data.montoUsd,
          tasaPactada: data.tasaPactada,
          montoCupTotal,
          gananciaCup,
          monedaPago: data.monedaPago,
          porcentajeComision: data.porcentajeComision ?? null,
        },
        include: {
          comprador: {
            select: { id: true, nombre: true },
          },
          abonos: true,
        },
      }),
      prisma.persona.update({
        where: { id: existing.compradorId },
        data: { balanceCup: { decrement: previousMontoCupTotal } },
      }),
      prisma.persona.update({
        where: { id: data.compradorId },
        data: { balanceCup: { increment: montoCupTotal } },
      }),
    ]);

    return NextResponse.json(wire);
  } catch (error: unknown) {
    const err = error as Error & { errors?: unknown; name?: string; code?: string };
    if (err.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos invalidos", details: (err as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
