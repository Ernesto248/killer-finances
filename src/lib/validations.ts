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

export const cuadreSchema = z.object({
  personaId: z.string().min(1, "La persona es requerida"),
  nota: z.string().optional().nullable(),
  deudaInicialCup: z.number().default(0),
  pagadoCup: z.number().default(0),
  deudaFinalCup: z.number().default(0),
  totalZelleUsd: z.number().default(0),
  tasaPromedioCup: z.number().default(0),
  lineas: z.array(z.object({
    montoUsd: z.number().min(0),
    tasa: z.number().min(0),
    modalidad: z.enum(["TASA", "COMISION"]).default("TASA"),
    porcentajeComision: z.number().optional().nullable(),
    montoCupResultante: z.number().default(0),
    gananciaUsd: z.number().default(0),
  })),
});

export type CuadreFormData = z.infer<typeof cuadreSchema>;

export const pagoSchema = z.object({
  personaId: z.string().min(1, "La persona es requerida"),
  monto: z.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["USD", "CUP"]),
  descripcion: z.string().optional().nullable(),
});

export type PagoFormData = z.infer<typeof pagoSchema>;

export const wireSchema = z.object({
  compradorId: z.string().min(1, "El comprador es requerido"),
  montoUsd: z.number().positive("El monto debe ser positivo"),
  tasaPactada: z.number().positive("La tasa es requerida"),
  monedaPago: z.enum(["CUP", "USD"]).default("CUP"),
  porcentajeComision: z.number().optional().nullable(),
});

export type WireFormData = z.infer<typeof wireSchema>;

export const abonoWireSchema = z.object({
  monto: z.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["CUP", "USD"]).default("CUP"),
});

export type AbonoWireFormData = z.infer<typeof abonoWireSchema>;

export const reventaWireSchema = z.object({
  compradorId: z.string().min(1, "El comprador es requerido"),
  vendedorId: z.string().min(1, "El vendedor es requerido"),
  montoUsd: z.number().positive("El monto debe ser positivo"),
  tasaCompra: z.number().positive("Tasa de compra requerida"),
  tasaVenta: z.number().positive("Tasa de venta requerida"),
}).refine(
  (data) => data.compradorId !== data.vendedorId,
  { message: "El comprador y vendedor no pueden ser la misma persona", path: ["vendedorId"] }
);

export type ReventaWireFormData = z.infer<typeof reventaWireSchema>;
