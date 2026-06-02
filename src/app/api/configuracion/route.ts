import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    let config = await prisma.configuracion.findUnique({ where: { id: "global" } });
    if (!config) {
      config = await prisma.configuracion.create({
        data: { id: "global", tasaUsdGlobal: 600 },
      });
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

    const config = await prisma.configuracion.update({
      where: { id: "global" },
      data: { tasaUsdGlobal },
    });

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
