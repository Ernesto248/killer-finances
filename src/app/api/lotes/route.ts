import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { loteSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const lotes = await prisma.lote.findMany({
      orderBy: { fechaCompra: "desc" },
      include: {
        productos: true,
        ventas: true,
        gastos: true,
      },
    });
    return NextResponse.json(lotes);
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

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = loteSchema.parse(body);

    const lote = await prisma.lote.create({
      data: {
        nombre: data.nombre,
        costoTotal: data.costoTotal,
        monedaCosto: data.monedaCosto,
        productos: data.productos?.length
          ? {
              create: data.productos.map((p) => ({
                nombre: p.nombre,
                cantidadTotal: p.cantidadTotal,
                costoUnitario: p.costoUnitario,
              })),
            }
          : undefined,
      },
      include: {
        productos: true,
      },
    });

    return NextResponse.json(lote, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error & { errors?: unknown; name?: string };
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
