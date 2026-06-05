export interface PersonaRaw {
  id: string;
  nombre: string;
  telefono: string | null;
  alias: string | null;
  balance_usd: number | string;
  balance_cup: number | string;
  tipo: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export function mapPersonaRaw(raw: PersonaRaw) {
  const toNumber = (value: number | string) =>
    typeof value === "string" ? Number(value) : value;

  return {
    id: raw.id,
    nombre: raw.nombre,
    telefono: raw.telefono,
    alias: raw.alias,
    balanceUsd: toNumber(raw.balance_usd),
    balanceCup: toNumber(raw.balance_cup),
    tipo: raw.tipo,
    activo: raw.activo,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
