import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";
import { reventaWireSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const reventas = await withRetry(
      () =>
        prisma.reventaWire.findMany({
          orderBy: { fecha: "desc" },
          select: {
            id: true,
            compradorId: true,
            vendedorId: true,
            fecha: true,
            montoUsd: true,
            tasaCompra: true,
            tasaVenta: true,
            gananciaCup: true,
            deudaCompradorPendiente: true,
            deudaVendedorPendiente: true,
            createdAt: true,
            comprador: { select: { id: true, nombre: true } },
            vendedor: { select: { id: true, nombre: true } },
          },
        }),
      { label: "reventas.list" }
    );
    return NextResponse.json(reventas);
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
    const data = reventaWireSchema.parse(body);

    const gananciaCup = Math.round(data.montoUsd * (data.tasaCompra - data.tasaVenta));
    const deudaCompradorPendiente = Math.round(data.montoUsd * data.tasaCompra);
    const deudaVendedorPendiente = Math.round(data.montoUsd * data.tasaVenta);

    const [reventa] = await prisma.$transaction([
      withRetry(
        () => prisma.reventaWire.create({
          data: {
            compradorId: data.compradorId,
            vendedorId: data.vendedorId,
            montoUsd: data.montoUsd,
            tasaCompra: data.tasaCompra,
            tasaVenta: data.tasaVenta,
            gananciaCup,
            deudaCompradorPendiente,
            deudaVendedorPendiente,
          },
          include: {
            comprador: {
              select: { id: true, nombre: true },
            },
            vendedor: {
              select: { id: true, nombre: true },
            },
          },
        }),
        { label: "reventas.create" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: data.compradorId },
          data: { balanceCup: { increment: deudaCompradorPendiente } },
        }),
        { label: "reventas.create.comprador" }
      ),
      withRetry(
        () => prisma.persona.update({
          where: { id: data.vendedorId },
          data: { balanceCup: { decrement: deudaVendedorPendiente } },
        }),
        { label: "reventas.create.vendedor" }
      ),
    ]);

    return NextResponse.json(reventa, { status: 201 });
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
