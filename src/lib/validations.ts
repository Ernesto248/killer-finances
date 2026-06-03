import { z } from "zod";

export const personaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
  tipo: z.string().min(1, "El tipo es requerido"),
  activo: z.boolean().default(true),
  balanceUsd: z.coerce.number().default(0),
  balanceCup: z.coerce.number().default(0),
});

export type PersonaFormData = z.infer<typeof personaSchema>;

export const cuentaBancariaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  moneda: z.enum(["USD", "CUP"]),
  saldoActual: z.coerce.number().min(0, "El saldo no puede ser negativo"),
  tipo: z.enum(["ZELLE", "EFECTIVO", "BANCO"]),
});

export type CuentaBancariaFormData = z.infer<typeof cuentaBancariaSchema>;

export const cuadreSchema = z.object({
  personaId: z.string().min(1, "La persona es requerida"),
  nota: z.string().optional().nullable(),
  deudaInicialCup: z.coerce.number().default(0),
  pagadoCup: z.coerce.number().default(0),
  deudaFinalCup: z.coerce.number().default(0),
  totalZelleUsd: z.coerce.number().default(0),
  tasaPromedioCup: z.coerce.number().default(0),
  lineas: z.array(z.object({
    montoUsd: z.coerce.number().min(0),
    tasa: z.coerce.number().min(0),
    modalidad: z.enum(["TASA", "COMISION"]).default("TASA"),
    porcentajeComision: z.coerce.number().optional().nullable(),
    montoCupResultante: z.coerce.number().default(0),
    gananciaUsd: z.coerce.number().default(0),
  })),
});

export type CuadreFormData = z.infer<typeof cuadreSchema>;

export const pagoSchema = z.object({
  personaId: z.string().min(1, "La persona es requerida"),
  monto: z.coerce.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["USD", "CUP"]),
  descripcion: z.string().optional().nullable(),
});

export type PagoFormData = z.infer<typeof pagoSchema>;

export const wireSchema = z.object({
  compradorId: z.string().min(1, "El comprador es requerido"),
  montoUsd: z.coerce.number().positive("El monto debe ser positivo"),
  tasaPactada: z.coerce.number().positive("La tasa es requerida"),
  monedaPago: z.enum(["CUP", "USD"]).default("CUP"),
  porcentajeComision: z.coerce.number().optional().nullable(),
});

export type WireFormData = z.infer<typeof wireSchema>;

export const abonoWireSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["CUP", "USD"]).default("CUP"),
});

export type AbonoWireFormData = z.infer<typeof abonoWireSchema>;

export const reventaWireSchema = z.object({
  compradorId: z.string().min(1, "El comprador es requerido"),
  vendedorId: z.string().min(1, "El vendedor es requerido"),
  montoUsd: z.coerce.number().positive("El monto debe ser positivo"),
  tasaCompra: z.coerce.number().positive("Tasa de compra requerida"),
  tasaVenta: z.coerce.number().positive("Tasa de venta requerida"),
}).refine(
  (data) => data.compradorId !== data.vendedorId,
  { message: "El comprador y vendedor no pueden ser la misma persona", path: ["vendedorId"] }
);

export type ReventaWireFormData = z.infer<typeof reventaWireSchema>;

export const loteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  costoTotal: z.coerce.number().min(0).default(0),
  monedaCosto: z.enum(["USD", "CUP"]).default("USD"),
  productos: z.array(z.object({
    nombre: z.string().min(1, "Nombre del producto requerido"),
    cantidadTotal: z.coerce.number().min(0).default(0),
    costoUnitario: z.coerce.number().min(0).default(0),
  })).optional().default([]),
});

export type LoteFormData = z.infer<typeof loteSchema>;

export const loteVentaSchema = z.object({
  cantidad: z.coerce.number().positive("La cantidad debe ser positiva"),
  precioUnitario: z.coerce.number().min(0, "El precio debe ser 0 o mayor"),
  moneda: z.enum(["USD", "CUP"]).default("CUP"),
  personaId: z.string().optional().nullable(),
});

export type LoteVentaFormData = z.infer<typeof loteVentaSchema>;

export const gastoSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["USD", "CUP"]).default("CUP"),
  categoria: z.enum(["SERVICIOS", "SALARIOS", "LOGISTICA", "IMPREVISTOS", "OTROS"]).default("OTROS"),
  descripcion: z.string().optional().nullable(),
  loteId: z.string().optional().nullable(),
});

export type GastoFormData = z.infer<typeof gastoSchema>;
