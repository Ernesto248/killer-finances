import { prisma } from "./prisma";

interface CuentaRaw {
  id: string;
  nombre: string;
  moneda: string;
  saldo_actual: number;
  tipo: string;
  created_at: Date;
  updated_at: Date;
}

function toCuenta(raw: CuentaRaw) {
  return {
    id: raw.id,
    nombre: raw.nombre,
    moneda: raw.moneda,
    saldoActual: raw.saldo_actual,
    tipo: raw.tipo,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function safeFindCuentas() {
  try {
    return await prisma.cuentaBancaria.findMany();
  } catch {
    const raw = await prisma.$queryRaw<CuentaRaw[]>`SELECT * FROM cuentas_bancarias ORDER BY created_at DESC`;
    return raw.map(toCuenta) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.findMany>>;
  }
}

export async function safeFindCuentaById(id: string) {
  try {
    return await prisma.cuentaBancaria.findUnique({ where: { id } });
  } catch {
    const raw = await prisma.$queryRaw<CuentaRaw[]>`SELECT * FROM cuentas_bancarias WHERE id = ${id} LIMIT 1`;
    return raw.length > 0 ? (toCuenta(raw[0]) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.findUnique>>) : null;
  }
}

export async function safeCreateCuenta(data: { nombre: string; moneda: string; saldoActual: number; tipo: string }) {
  try {
    return await prisma.cuentaBancaria.create({ data });
  } catch {
    const raw = await prisma.$queryRaw<CuentaRaw[]>`
      INSERT INTO cuentas_bancarias (nombre, moneda, saldo_actual, tipo)
      VALUES (${data.nombre}, ${data.moneda}, ${data.saldoActual}, ${data.tipo})
      RETURNING *
    `;
    return toCuenta(raw[0]) as unknown as Awaited<ReturnType<typeof prisma.cuentaBancaria.create>>;
  }
}

export async function safeUpdateCuenta(id: string, data: { nombre?: string; moneda?: string; saldoActual?: number; tipo?: string }) {
  try {
    return await prisma.cuentaBancaria.update({ where: { id }, data });
  } catch {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.nombre !== undefined) { sets.push(`nombre = $${i++}`); vals.push(data.nombre); }
    if (data.moneda !== undefined) { sets.push(`moneda = $${i++}`); vals.push(data.moneda); }
    if (data.saldoActual !== undefined) { sets.push(`saldo_actual = $${i++}`); vals.push(data.saldoActual); }
    if (data.tipo !== undefined) { sets.push(`tipo = $${i++}`); vals.push(data.tipo); }
    vals.push(id);
    await prisma.$executeRawUnsafe(`UPDATE cuentas_bancarias SET ${sets.join(", ")} WHERE id = $${i}`, ...vals);
    return safeFindCuentaById(id);
  }
}

export async function safeDeleteCuenta(id: string) {
  try {
    return await prisma.cuentaBancaria.delete({ where: { id } });
  } catch {
    await prisma.$executeRaw`DELETE FROM cuentas_bancarias WHERE id = ${id}`;
  }
}
