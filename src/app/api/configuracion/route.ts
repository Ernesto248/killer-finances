import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    let config = await withRetry(
      () => prisma.configuracion.findUnique({ where: { id: "global" } }),
      { label: "configuracion.find" }
    );
    if (!config) {
      config = await withRetry(
        () => prisma.configuracion.create({
          data: { id: "global", tasaUsdGlobal: 600 },
        }),
        { label: "configuracion.create" }
      );
    }
    return NextResponse.json({ tasaUsdGlobal: Number(config.tasaUsdGlobal) });
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

export async function PUT(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const tasaUsdGlobal = Number(body.tasaUsdGlobal);

    if (!tasaUsdGlobal || tasaUsdGlobal <= 0) {
      return NextResponse.json(
        { error: "La tasa debe ser un numero positivo" },
        { status: 400 }
      );
    }

    const config = await withRetry(
      () => prisma.configuracion.update({
        where: { id: "global" },
        data: { tasaUsdGlobal },
      }),
      { label: "configuracion.update" }
    );

    return NextResponse.json({ tasaUsdGlobal: Number(config.tasaUsdGlobal) });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
