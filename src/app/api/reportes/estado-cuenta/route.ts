import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { withRetry } from "@/lib/db-retry";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const { searchParams } = new URL(req.url);
    const personaId = searchParams.get("personaId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!personaId || !from || !to) {
      return NextResponse.json(
        { error: "personaId, from, y to son requeridos" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const persona = await withRetry(
      () => prisma.persona.findUnique({ where: { id: personaId }, select: { id: true, nombre: true, alias: true } }),
      { label: "estadoCuenta.persona" }
    );

    if (!persona) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    }

    const lastCuadreBeforeFrom = await withRetry(
      () => prisma.cuadre.findFirst({
        where: { personaId, fecha: { lt: fromDate } },
        orderBy: { fecha: "desc" },
        select: { totalZelleUsd: true, deudaFinalCup: true },
      }),
      { label: "estadoCuenta.lastCuadre" }
    );

    const balanceInicial = {
      usd: Number(lastCuadreBeforeFrom?.totalZelleUsd ?? 0),
      cup: Number(lastCuadreBeforeFrom?.deudaFinalCup ?? 0),
    };

    const [cuadres, pagos, wires] = await Promise.all([
      withRetry(
        () => prisma.cuadre.findMany({
          where: { personaId, fecha: { gte: fromDate, lte: toDate } },
          orderBy: { fecha: "asc" },
          include: { lineas: true },
        }),
        { label: "estadoCuenta.cuadres" }
      ),
      withRetry(
        () => prisma.pago.findMany({
          where: { personaId, fecha: { gte: fromDate, lte: toDate } },
          orderBy: { fecha: "asc" },
        }),
        { label: "estadoCuenta.pagos" }
      ),
      withRetry(
        () => prisma.wire.findMany({
          where: { compradorId: personaId, fecha: { gte: fromDate, lte: toDate } },
          orderBy: { fecha: "asc" },
        }),
        { label: "estadoCuenta.wires" }
      ),
    ]);

    const usdFromCuadres = cuadres.reduce((s, c) => s + Number(c.totalZelleUsd), 0);
    const cupFromCuadres = cuadres.reduce(
      (s, c) =>
        s +
        Number(c.deudaFinalCup) -
        Number(c.deudaInicialCup) +
        Number(c.pagadoCup),
      0
    );
    const usdFromPagos = pagos
      .filter((p) => p.moneda === "USD")
      .reduce((s, p) => s + Number(p.monto), 0);
    const cupFromPagos = pagos
      .filter((p) => p.moneda === "CUP")
      .reduce((s, p) => s + Number(p.monto), 0);
    const cupFromWires = wires.reduce((s, w) => s + Number(w.montoCupTotal), 0);

    const balanceFinal = {
      usd: balanceInicial.usd + usdFromCuadres - usdFromPagos,
      cup: balanceInicial.cup + cupFromCuadres - cupFromPagos + cupFromWires,
    };

    return NextResponse.json({
      persona,
      balanceInicial,
      cuadres,
      pagos,
      wires,
      balanceFinal,
    });
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
