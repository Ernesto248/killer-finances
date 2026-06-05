import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { calculateUpdatedPersonaBalances } from "@/lib/cuadres";
import { safeFindCuadres } from "@/lib/cuadres-helpers";
import { cuadreSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const cuadres = await safeFindCuadres();
    return NextResponse.json(cuadres);
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
    const data = cuadreSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const personaActual = await tx.persona.findUnique({
        where: { id: data.personaId },
        select: { balanceCup: true, balanceUsd: true },
      });

      if (!personaActual) {
        const notFoundError = new Error("Persona no encontrada") as Error & {
          code?: string;
        };
        notFoundError.code = "P2025";
        throw notFoundError;
      }

      const cuadre = await tx.cuadre.create({
        data: {
          personaId: data.personaId,
          nota: data.nota ?? null,
          previousBalanceCup: personaActual.balanceCup,
          previousBalanceUsd: personaActual.balanceUsd,
          deudaInicialCup: data.deudaInicialCup,
          pagadoCup: data.pagadoCup,
          deudaFinalCup: data.deudaFinalCup,
          totalZelleUsd: data.totalZelleUsd,
          tasaPromedioCup: data.tasaPromedioCup,
          lineas: {
            create: data.lineas.map((l) => ({
              montoUsd: l.montoUsd,
              tasa: l.tasa,
              modalidad: l.modalidad,
              porcentajeComision: l.porcentajeComision ?? null,
              montoCupResultante: l.montoCupResultante,
              gananciaUsd: l.gananciaUsd,
            })),
          },
        },
        include: {
          persona: true,
          lineas: true,
        },
      });

      const persona = await tx.persona.update({
        where: { id: data.personaId },
        data: calculateUpdatedPersonaBalances({
          currentBalanceUsd: Number(personaActual.balanceUsd ?? 0),
          deudaFinalCup: data.deudaFinalCup,
          totalZelleUsd: data.totalZelleUsd,
        }),
      });

      return { cuadre, persona };
    });

    return NextResponse.json(result, { status: 201 });
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
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
