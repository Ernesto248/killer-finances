import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { abonoWireSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = abonoWireSchema.parse(body);

    const wire = await prisma.wire.findUnique({
      where: { id: params.id },
      include: { abonos: true },
    });
    if (!wire) {
      return NextResponse.json({ error: "Wire no encontrado" }, { status: 404 });
    }

    const newPagado = Number(wire.montoPagadoCup) + data.monto;
    const totalCup = Number(wire.montoCupTotal);

    let estado = "PENDIENTE";
    if (newPagado > 0 && newPagado < totalCup) {
      estado = "PARCIAL";
    } else if (newPagado >= totalCup) {
      estado = "PAGADO";
    }

    const [abono] = await prisma.$transaction([
      prisma.abonoWire.create({
        data: {
          wireId: params.id,
          monto: data.monto,
          moneda: data.moneda,
        },
      }),
      prisma.wire.update({
        where: { id: params.id },
        data: {
          montoPagadoCup: newPagado,
          estado,
        },
      }),
      prisma.persona.update({
        where: { id: wire.compradorId },
        data: { balanceCup: { decrement: data.monto } },
      }),
    ]);

    return NextResponse.json(abono, { status: 201 });
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
