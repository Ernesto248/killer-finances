import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { gastoSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const gastos = await withRetry(
      () =>
        prisma.gasto.findMany({
          orderBy: { fecha: "desc" },
          select: {
            id: true,
            fecha: true,
            monto: true,
            moneda: true,
            categoria: true,
            descripcion: true,
            loteId: true,
            createdAt: true,
            lote: { select: { id: true, nombre: true } },
          },
        }),
      { label: "gastos.list" }
    );
    return NextResponse.json(gastos);
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
    const data = gastoSchema.parse(body);

    const gasto = await withRetry(
      () => prisma.gasto.create({
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
      }),
      { label: "gastos.create" }
    );

    return NextResponse.json(gasto, { status: 201 });
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
