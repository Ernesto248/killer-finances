import "server-only";

import { prisma } from "./prisma";
import { withRetry } from "./db-retry";
import { mapPersonaRaw, type PersonaRaw } from "./personas-mapper";

export { mapPersonaRaw };
export type { PersonaRaw };

const PERSONA_LIST_SELECT = {
  id: true,
  nombre: true,
  alias: true,
  tipo: true,
  activo: true,
  balanceUsd: true,
  balanceCup: true,
} as const;

const PERSONA_LIST_TAKE = 500;

export async function safeFindPersonas() {
  try {
    return await withRetry(
      () =>
        prisma.persona.findMany({
          orderBy: { createdAt: "desc" },
          take: PERSONA_LIST_TAKE,
          select: PERSONA_LIST_SELECT,
        }),
      { label: "safeFindPersonas" }
    );
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<PersonaRaw[]>`
          SELECT id, nombre, telefono, alias, balance_usd, balance_cup, tipo, activo, created_at, updated_at
          FROM personas
          ORDER BY created_at DESC
          LIMIT ${PERSONA_LIST_TAKE}
        `,
        { label: "safeFindPersonas.raw" }
      );
      return raw.map(mapPersonaRaw) as unknown as Awaited<
        ReturnType<typeof prisma.persona.findMany>
      >;
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeFindPersonas failed", { primaryCode, fallbackCode });
      return [];
    }
  }
}

export async function safeFindPersonaById(id: string) {
  try {
    return await withRetry(
      () =>
        prisma.persona.findUnique({
          where: { id },
          include: {
            cuadres: { orderBy: { fecha: "desc" }, take: 20 },
            pagos: { orderBy: { fecha: "desc" }, take: 20 },
            wiresComprados: { orderBy: { fecha: "desc" }, take: 10 },
          },
        }),
      { label: "safeFindPersonaById" }
    );
  } catch (primaryError) {
    try {
      const raw = await withRetry(
        () => prisma.$queryRaw<PersonaRaw[]>`
          SELECT * FROM personas WHERE id = ${id} LIMIT 1
        `,
        { label: "safeFindPersonaById.raw" }
      );
      return raw.length > 0
        ? (mapPersonaRaw(raw[0]) as unknown as Awaited<
            ReturnType<typeof prisma.persona.findUnique>
          >)
        : null;
    } catch (fallbackError) {
      const primaryCode = (primaryError as { code?: string })?.code;
      const fallbackCode = (fallbackError as { code?: string })?.code;
      console.error("safeFindPersonaById failed", { id, primaryCode, fallbackCode });
      return null;
    }
  }
}
