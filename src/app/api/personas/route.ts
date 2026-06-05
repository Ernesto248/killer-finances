import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { safeFindPersonas } from "@/lib/personas-helpers";
import { personaSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const personas = await safeFindPersonas();
    return NextResponse.json(personas);
  } catch (error: unknown) {
    const err = error as Error & { errors?: unknown };
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
    const data = personaSchema.parse(body);

    const persona = await withRetry(
      () => prisma.persona.create({
        data: {
          nombre: data.nombre,
          telefono: data.telefono ?? null,
          alias: data.alias ?? null,
          tipo: data.tipo,
          activo: data.activo,
          balanceUsd: data.balanceUsd ?? 0,
          balanceCup: data.balanceCup ?? 0,
        },
      }),
      { label: "personas.create" }
    );

    return NextResponse.json(persona, { status: 201 });
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
