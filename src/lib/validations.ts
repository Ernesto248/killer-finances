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
