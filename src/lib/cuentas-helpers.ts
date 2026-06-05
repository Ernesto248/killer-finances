import "server-only";

import { prisma } from "./prisma";
import { withRetry } from "./db-retry";

interface CuentaRaw {
  id: string;
  nombre: string;
  moneda: string;
  saldo_actual: number | string;
  tipo: string;
  created_at: Date;
  updated_at: Date;
}

function toCuenta(raw: CuentaRaw) {
  return {
    id: raw.id,
    nombre: raw.nombre,
    moneda: raw.moneda,
    saldoActual: typeof raw.saldo_actual === "string" ? Number(raw.saldo_actual) : raw.saldo_actual,
    tipo: raw.tipo,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function safeFindCuentas() {
  try {
    return await withRetry(() => prisma.cuentaBancaria.findMany(), { label: "safeFindCuentas" });
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<CuentaRaw[]>`SELECT * FROM cuentas_bancarias ORDER BY created_at DESC`,
        { label: "safeFindCuentas.raw" }
      );
      return raw.map(toCuenta) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.findMany>>;
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeFindCuentas failed", { primaryCode, fallbackCode });
      return [];
    }
  }
}

export async function safeFindCuentaById(id: string) {
  try {
    return await withRetry(
      () => prisma.cuentaBancaria.findUnique({ where: { id } }),
      { label: "safeFindCuentaById" }
    );
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<CuentaRaw[]>`SELECT * FROM cuentas_bancarias WHERE id = ${id} LIMIT 1`,
        { label: "safeFindCuentaById.raw" }
      );
      return raw.length > 0 ? (toCuenta(raw[0]) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.findUnique>>) : null;
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeFindCuentaById failed", { id, primaryCode, fallbackCode });
      return null;
    }
  }
}

export async function safeCreateCuenta(data: { nombre: string; moneda: string; saldoActual: number; tipo: string }) {
  try {
    return await withRetry(() => prisma.cuentaBancaria.create({ data }), { label: "safeCreateCuenta" });
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<CuentaRaw[]>`
          INSERT INTO cuentas_bancarias (nombre, moneda, saldo_actual, tipo)
          VALUES (${data.nombre}, ${data.moneda}, ${data.saldoActual}, ${data.tipo})
          RETURNING *
        `,
        { label: "safeCreateCuenta.raw" }
      );
      return toCuenta(raw[0]) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.create>>;
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeCreateCuenta failed", { primaryCode, fallbackCode });
      throw fallbackError;
    }
  }
}

export async function safeUpdateCuenta(id: string, data: { nombre?: string; moneda?: string; saldoActual?: number; tipo?: string }) {
  try {
    return await withRetry(
      () => prisma.cuentaBancaria.update({ where: { id }, data }),
      { label: "safeUpdateCuenta" }
    );
  } catch (primaryError) {
    try {
      const sets: string[] = [];
      const vals: any[] = [];
      let i = 1;
      if (data.nombre !== undefined) { sets.push(`nombre = $${i++}`); vals.push(data.nombre); }
      if (data.moneda !== undefined) { sets.push(`moneda = $${i++}`); vals.push(data.moneda); }
      if (data.saldoActual !== undefined) { sets.push(`saldo_actual = $${i++}`); vals.push(data.saldoActual); }
      if (data.tipo !== undefined) { sets.push(`tipo = $${i++}`); vals.push(data.tipo); }
      vals.push(id);
      await withRetry(
        () => prisma.$executeRawUnsafe(`UPDATE cuentas_bancarias SET ${sets.join(", ")} WHERE id = $${i}`, ...vals),
        { label: "safeUpdateCuenta.raw" }
      );
      return safeFindCuentaById(id);
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeUpdateCuenta failed", { id, primaryCode, fallbackCode });
      throw fallbackError;
    }
  }
}

export async function safeDeleteCuenta(id: string) {
  try {
    return await withRetry(
      () => prisma.cuentaBancaria.delete({ where: { id } }),
      { label: "safeDeleteCuenta" }
    );
  } catch (primaryError) {
    try {
      await withRetry(
        () => prisma.$executeRaw`DELETE FROM cuentas_bancarias WHERE id = ${id}`,
        { label: "safeDeleteCuenta.raw" }
      );
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeDeleteCuenta failed", { id, primaryCode, fallbackCode });
      throw fallbackError;
    }
  }
}
