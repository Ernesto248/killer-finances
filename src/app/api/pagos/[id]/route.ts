import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { pagoSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = pagoSchema.parse(body);

    const existing = await withRetry(
      () => prisma.pago.findUnique({ where: { id: params.id } }),
      { label: "pagos.update.find" }
    );
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const [updated] = await prisma.$transaction([
      withRetry(
        () => prisma.pago.update({
          where: { id: params.id },
          data: {
            personaId: data.personaId,
            monto: data.monto,
            moneda: data.moneda,
            descripcion: data.descripcion ?? null,
          },
          include: {
            persona: {
              select: { id: true, nombre: true },
            },
          },
        }),
        { label: "pagos.update.pago" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: existing.personaId },
          data:
            existing.moneda === "CUP"
              ? { balanceCup: { increment: existing.monto } }
              : { balanceUsd: { increment: existing.monto } },
        }),
        { label: "pagos.update.personaRestore" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: data.personaId },
          data:
            data.moneda === "CUP"
              ? { balanceCup: { decrement: data.monto } }
              : { balanceUsd: { decrement: data.monto } },
        }),
        { label: "pagos.update.personaApply" }
      ),
    ]);

    return NextResponse.json(updated);
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

    const existing = await withRetry(
      () => prisma.pago.findUnique({ where: { id: params.id } }),
      { label: "pagos.delete.find" }
    );
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.$transaction([
      withRetry(
        () => prisma.pago.delete({ where: { id: params.id } }),
        { label: "pagos.delete.pago" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: existing.personaId },
          data:
            existing.moneda === "CUP"
              ? { balanceCup: { increment: existing.monto } }
              : { balanceUsd: { increment: existing.monto } },
        }),
        { label: "pagos.delete.persona" }
      ),
    ]);

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
