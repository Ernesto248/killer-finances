import { z } from "zod";

export const personaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
  tipo: z.string().min(1, "El tipo es requerido"),
  activo: z.boolean().default(true),
  balanceUsd: z.number().default(0),
  balanceCup: z.number().default(0),
});

export type PersonaFormData = z.infer<typeof personaSchema>;

export const cuentaBancariaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  moneda: z.enum(["USD", "CUP"]),
  saldoActual: z.number().min(0, "El saldo no puede ser negativo"),
  tipo: z.enum(["ZELLE", "EFECTIVO", "BANCO"]),
});

export type CuentaBancariaFormData = z.infer<typeof cuentaBancariaSchema>;
