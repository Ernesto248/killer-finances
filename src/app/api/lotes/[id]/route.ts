import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { loteSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: {
        productos: true,
        ventas: {
          include: {
            persona: {
              select: { id: true, nombre: true },
            },
          },
        },
        gastos: true,
      },
    });
    if (!lote) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(lote);
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
    const data = loteSchema.parse(body);

    const [, lote] = await prisma.$transaction([
      prisma.loteProducto.deleteMany({ where: { loteId: params.id } }),
      prisma.lote.update({
        where: { id: params.id },
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
      }),
    ]);

    return NextResponse.json(lote);
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

    await prisma.lote.delete({ where: { id: params.id } });

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
