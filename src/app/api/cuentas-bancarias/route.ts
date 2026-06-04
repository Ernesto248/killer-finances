import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { cuentaBancariaSchema } from "@/lib/validations";
import { safeFindCuentas, safeCreateCuenta } from "@/lib/cuentas-helpers";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const cuentas = await safeFindCuentas();
    return NextResponse.json(cuentas);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (err.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = cuentaBancariaSchema.parse(body);
    const cuenta = await safeCreateCuenta({
      nombre: data.nombre,
      tipo: data.tipo,
      moneda: data.moneda,
      saldoActual: data.saldoActual,
    });
    return NextResponse.json(cuenta, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error & { errors?: unknown; name?: string };
    if (err.message === "No autenticado") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (err.message === "No autorizado") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (err.name === "ZodError") return NextResponse.json({ error: "Datos invalidos", details: (err as { errors: unknown }).errors }, { status: 400 });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
