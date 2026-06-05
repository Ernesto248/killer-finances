import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { pagoSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const pagos = await withRetry(
      () =>
        prisma.pago.findMany({
          orderBy: { fecha: "desc" },
          select: {
            id: true,
            personaId: true,
            fecha: true,
            monto: true,
            moneda: true,
            descripcion: true,
            createdAt: true,
            persona: { select: { id: true, nombre: true } },
          },
        }),
      { label: "pagos.list" }
    );
    return NextResponse.json(pagos);
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
    const data = pagoSchema.parse(body);

    const [pago] = await prisma.$transaction([
      withRetry(
        () => prisma.pago.create({
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
        { label: "pagos.create" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: data.personaId },
          data:
            data.moneda === "CUP"
              ? { balanceCup: { decrement: data.monto } }
              : { balanceUsd: { decrement: data.monto } },
        }),
        { label: "pagos.create.persona" }
      ),
    ]);

    return NextResponse.json(pago, { status: 201 });
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
