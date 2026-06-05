import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { loteVentaSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const ventas = await withRetry(
      () => prisma.loteVenta.findMany({
        where: { loteId: params.id },
        orderBy: { fecha: "desc" },
        include: {
          persona: {
            select: { id: true, nombre: true },
          },
        },
      }),
      { label: "lotes.ventas.list" }
    );
    return NextResponse.json(ventas);
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = loteVentaSchema.parse(body);

    const venta = await withRetry(
      () => prisma.loteVenta.create({
        data: {
          loteId: params.id,
          cantidad: data.cantidad,
          precioUnitario: data.precioUnitario,
          moneda: data.moneda,
          personaId: data.personaId ?? null,
        },
        include: {
          persona: {
            select: { id: true, nombre: true },
          },
        },
      }),
      { label: "lotes.ventas.create" }
    );

    return NextResponse.json(venta, { status: 201 });
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
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
