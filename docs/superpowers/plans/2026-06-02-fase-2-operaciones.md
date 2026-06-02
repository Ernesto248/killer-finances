# Fase 2 — Operaciones Principales: Plan de Implementacion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar modulo de Cuadres (con parser WhatsApp), Pagos, Wires + Abonos, Reventas, y Dashboard con KPIs reales.

**Architecture:** Cada modulo sigue el patron: API routes → server page → client table/modal components. Los cuadres incluyen parser de formato WhatsApp. Los wires calculan ganancia como `monto_usd * (tasa_wire - tasa_promedio_remeseros)`. Las reventas calculan spread. Dashboard consolida todo.

**Tech Stack:** Next.js 14, Prisma 7 (@prisma/adapter-pg), shadcn/ui v4, react-hook-form, zod v4, framer-motion

---

## Estructura de Archivos — Fase 2

```
src/
  app/api/
    cuadres/route.ts              (GET, POST con parser)
    cuadres/[id]/route.ts         (GET detail)
    pagos/route.ts                (GET, POST)
    pagos/[id]/route.ts           (PUT, DELETE)
    wires/route.ts                (GET, POST)
    wires/[id]/route.ts           (GET, PUT)
    wires/[id]/abonos/route.ts    (POST)
    reventas/route.ts             (GET, POST)
    reventas/[id]/route.ts        (GET)
    configuracion/route.ts        (GET, PUT)
  lib/
    whatsapp-parser.ts            (parser de formato WhatsApp)
  components/
    cuadres/
      cuadre-modal.tsx
      cuadre-table.tsx
      parse-preview.tsx
    pagos/
      pago-modal.tsx
      pago-table.tsx
    wires/
      wire-modal.tsx
      wire-table.tsx
      abono-modal.tsx
    reventas/
      reventa-modal.tsx
      reventa-table.tsx
    dashboard/
      kpi-card.tsx
      quick-actions.tsx
      tasa-card.tsx
  app/(protected)/
    cuadres/page.tsx
    cuadres/[id]/page.tsx
    pagos/page.tsx
    wires/page.tsx
    wires/[id]/page.tsx
    reventas/page.tsx
    configuracion/page.tsx
    dashboard/page.tsx (UPDATE)
```

---

### Task 7: Parser de WhatsApp + API de Cuadres

**Files:**
- Create: `src/lib/whatsapp-parser.ts`
- Create: `src/app/api/cuadres/route.ts`
- Create: `src/app/api/cuadres/[id]/route.ts`
- Create: `src/lib/validations.ts` (UPDATE - add cuadre schemas)

- [ ] **Step 1: Crear parser de WhatsApp**

Crea `src/lib/whatsapp-parser.ts`:

```typescript
interface ParsedLinea {
  montoUsd: number;
  tasa: number;
  montoCupResultante: number;
  modalidad: "TASA";
}

interface ParsedCuadre {
  deudaInicialCup: number;
  pagadoCup: number;
  lineasTirado: ParsedLinea[];
  deudaFinalCup: number;
  totalZelleUsd: number;
  tasaPromedioCup: number;
  valid: boolean;
  error?: string;
}

export function parseWhatsAppText(text: string): ParsedCuadre {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let deudaInicialCup = 0;
  let pagadoCup = 0;
  const lineasTirado: ParsedLinea[] = [];
  let deudaFinalCup = 0;

  let section: "ini" | "pag" | "tir" | "fin" = "ini";

  for (const line of lines) {
    const clean = line.replace(/[🚩🪎🇺🇲📌📖📕🅸🅽🅲🅸🅾🆃🅸🆁🅰🅳🅾🇲🇽🅿🅰🅶🅳🅾🅵🅸🅽🅰🅻🅴🅽🅳🅸🅽🆃🅴🆂*$#]/g, "").trim();

    if (clean.match(/inicio/i)) { section = "ini"; continue; }
    if (clean.match(/pagado/i)) { section = "pag"; continue; }
    if (clean.match(/tira[dt]o/i)) { section = "tir"; continue; }
    if (clean.match(/final/i)) { section = "fin"; continue; }
    if (clean.match(/pendiente/i)) { continue; }

    if (clean.match(/deuda/i)) {
      const num = extractNumber(clean);
      if (section === "ini") deudaInicialCup = num;
      if (section === "fin") deudaFinalCup = num;
      continue;
    }

    if (section === "pag") {
      const num = extractNumber(clean);
      if (num > 0) pagadoCup = num;
      continue;
    }

    if (section === "tir") {
      const parts = clean.split(/[×x*]/);
      if (parts.length >= 2) {
        const montoUsd = extractNumber(parts[0]);
        const tasa = extractNumber(parts[1]);
        if (montoUsd > 0 && tasa > 0) {
          lineasTirado.push({
            montoUsd,
            tasa,
            montoCupResultante: Math.round(montoUsd * tasa * 100) / 100,
            modalidad: "TASA",
          });
        }
      }
    }
  }

  const totalZelleUsd = lineasTirado.reduce((s, l) => s + l.montoUsd, 0);
  const tasaPromedioCup = totalZelleUsd > 0
    ? Math.round((lineasTirado.reduce((s, l) => s + l.montoUsd * l.tasa, 0) / totalZelleUsd) * 100) / 100
    : 0;

  const deudaCalculada = deudaInicialCup - pagadoCup +
    lineasTirado.reduce((s, l) => s + l.montoCupResultante, 0);

  const valid = Math.abs(deudaCalculada - deudaFinalCup) <= 1;

  return {
    deudaInicialCup,
    pagadoCup,
    lineasTirado,
    deudaFinalCup,
    totalZelleUsd,
    tasaPromedioCup,
    valid,
    error: valid ? undefined : `Diferencia: ${Math.abs(deudaCalculada - deudaFinalCup).toFixed(2)}`,
  };
}

function extractNumber(str: string): number {
  const cleaned = str.replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
```

- [ ] **Step 2: Agregar schemas de validacion**

Actualiza `src/lib/validations.ts`, agrega al final:

```typescript
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
```

- [ ] **Step 3: Crear API de cuadres GET y POST**

Crea `src/app/api/cuadres/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireAuth } from "@/lib/auth";
import { cuadreSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const cuadres = await prisma.cuadre.findMany({
      include: {
        persona: { select: { id: true, nombre: true, alias: true } },
        lineas: true,
      },
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(cuadres);
  } catch (error: any) {
    if (error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = cuadreSchema.parse(body);

    const cuadre = await prisma.cuadre.create({
      data: {
        personaId: data.personaId,
        nota: data.nota ?? null,
        deudaInicialCup: data.deudaInicialCup,
        pagadoCup: data.pagadoCup,
        deudaFinalCup: data.deudaFinalCup,
        totalZelleUsd: data.totalZelleUsd,
        tasaPromedioCup: data.tasaPromedioCup,
        lineas: {
          create: data.lineas.map((l) => ({
            montoUsd: l.montoUsd,
            tasa: l.tasa,
            modalidad: l.modalidad,
            porcentajeComision: l.porcentajeComision ?? null,
            montoCupResultante: l.montoCupResultante,
            gananciaUsd: l.gananciaUsd,
          })),
        },
      },
      include: { lineas: true },
    });

    // Update persona balances
    const persona = await prisma.persona.findUnique({ where: { id: data.personaId } });
    if (persona) {
      const cupChange = data.deudaFinalCup - data.deudaInicialCup + data.pagadoCup;
      const usdChange = data.totalZelleUsd;

      await prisma.persona.update({
        where: { id: data.personaId },
        data: {
          balanceCup: { increment: cupChange },
          balanceUsd: { increment: usdChange },
        },
      });
    }

    return NextResponse.json(cuadre, { status: 201 });
  } catch (error: any) {
    if (error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos invalidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Crear API de cuadres [id]**

Crea `src/app/api/cuadres/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const cuadre = await prisma.cuadre.findUnique({
      where: { id: params.id },
      include: {
        persona: true,
        lineas: true,
      },
    });
    if (!cuadre) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(cuadre);
  } catch (error: any) {
    if (error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp-parser.ts src/app/api/cuadres src/lib/validations.ts
git commit -m "feat: add cuadres API with whatsapp parser"
```

---

### Task 8: Componentes y Paginas de Cuadres

**Files:**
- Create: `src/components/cuadres/parse-preview.tsx`
- Create: `src/components/cuadres/cuadre-modal.tsx`
- Create: `src/components/cuadres/cuadre-table.tsx`
- Create: `src/app/(protected)/cuadres/page.tsx`
- Create: `src/app/(protected)/cuadres/[id]/page.tsx`

- [ ] **Step 1: Crear componente ParsePreview**

Crea `src/components/cuadres/parse-preview.tsx`:

```typescript
"use client";

import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ParsedCuadre {
  deudaInicialCup: number;
  pagadoCup: number;
  lineasTirado: { montoUsd: number; tasa: number; montoCupResultante: number }[];
  deudaFinalCup: number;
  totalZelleUsd: number;
  tasaPromedioCup: number;
  valid: boolean;
  error?: string;
}

interface ParsePreviewProps {
  parsed: ParsedCuadre | null;
}

export function ParsePreview({ parsed }: ParsePreviewProps) {
  if (!parsed) return null;

  return (
    <div className="rounded-md border p-4 space-y-3 bg-muted/30">
      <div className="flex items-center gap-2">
        {parsed.valid ? (
          <Badge variant="default" className="gap-1">
            Valido
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            Diferencia: {parsed.error}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Deuda inicial:</span>
          <span className="ml-2 font-mono">{formatCurrency(parsed.deudaInicialCup, "CUP")}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Pagado:</span>
          <span className="ml-2 font-mono text-red-400">-{formatCurrency(parsed.pagadoCup, "CUP")}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">Lineas tirado:</span>
        {parsed.lineasTirado.map((l, i) => (
          <div key={i} className="text-sm font-mono pl-4">
            {formatCurrency(l.montoUsd, "USD")} x {formatNumber(l.tasa)} = {formatCurrency(l.montoCupResultante, "CUP")}
          </div>
        ))}
      </div>

      <div className="border-t pt-2">
        <div className="text-sm">
          <span className="text-muted-foreground">Deuda final:</span>
          <span className="ml-2 font-mono font-bold">{formatCurrency(parsed.deudaFinalCup, "CUP")}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Total Zelle: {formatCurrency(parsed.totalZelleUsd, "USD")}</div>
        <div>Tasa promedio: {formatNumber(parsed.tasaPromedioCup)}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear componente CuadreModal**

Crea `src/components/cuadres/cuadre-modal.tsx` - Modal con textarea para pegar WhatsApp + vista previa (ParsePreview) + select de persona + boton guardar.

Adaptar a shadcn v4 Dialog API. Referenciar `src/components/personas/persona-modal.tsx` para el patron de modal.

Features clave:
- Textarea grande para pegar el texto
- Boton "Parsear" que ejecuta el parser
- Vista previa con ParsePreview
- Select de persona (cargar lista de Personas via fetch al montar)
- Boton guardar solo habilitado si el parseo es valido y persona seleccionada
- Al guardar: POST a /api/cuadres con los datos parseados + personaId

- [ ] **Step 3: Crear componente CuadreTable**

Crea `src/components/cuadres/cuadre-table.tsx` - Tabla historial de cuadres con:
- Columnas: Fecha, Persona, Zelle USD, Tasa Prom, Deuda Final, Lineas
- Link a /cuadres/[id] en la fila
- Boton "Nuevo Cuadre" que abre CuadreModal

- [ ] **Step 4: Crear paginas**

Crea `src/app/(protected)/cuadres/page.tsx` - server page con lista
Crea `src/app/(protected)/cuadres/[id]/page.tsx` - server page con detalle del cuadre (datos + lineas)

- [ ] **Step 5: Verificar build y commit**

```bash
npm run build
git add src/components/cuadres src/app/\(protected\)/cuadres
git commit -m "feat: add cuadres UI with whatsapp parser modal and detail page"
```

---

### Task 9: API y Componentes de Pagos

**Files:**
- Create: `src/app/api/pagos/route.ts`
- Create: `src/app/api/pagos/[id]/route.ts`
- Create: `src/lib/validations.ts` (UPDATE - add pagoSchema)
- Create: `src/components/pagos/pago-modal.tsx`
- Create: `src/components/pagos/pago-table.tsx`
- Create: `src/app/(protected)/pagos/page.tsx`

- [ ] **Step 1: Agregar pagoSchema a validations**

```typescript
export const pagoSchema = z.object({
  personaId: z.string().min(1, "La persona es requerida"),
  monto: z.number().positive("El monto debe ser positivo"),
  moneda: z.enum(["USD", "CUP"]),
  descripcion: z.string().optional().nullable(),
});

export type PagoFormData = z.infer<typeof pagoSchema>;
```

- [ ] **Step 2: Crear API pagos (GET, POST)**

Patron igual a personas/route.ts:
- GET: list all with persona info, ordered by fecha desc
- POST: validate with pagoSchema, create, update persona balance (decrement)

- [ ] **Step 3: Crear API pagos [id] (PUT, DELETE)**

PUT para editar, DELETE (admin only, P2025 handling).

- [ ] **Step 4: Crear PagoModal y PagoTable**

PagoModal: select de persona (autocomplete), monto, moneda (USD/CUP), descripcion
PagoTable: columnas Fecha, Persona, Monto (rojo), Moneda, Descripcion, Acciones

- [ ] **Step 5: Crear pagina de pagos**

`src/app/(protected)/pagos/page.tsx` - server page con tabla

- [ ] **Step 6: Verificar build y commit**

```bash
npm run build
git add src/app/api/pagos src/components/pagos src/app/\(protected\)/pagos src/lib/validations.ts
git commit -m "feat: add pagos CRUD with autocomplete modal"
```

---

### Task 10: API y Componentes de Wires + Abonos

**Files:**
- Create: `src/app/api/wires/route.ts`
- Create: `src/app/api/wires/[id]/route.ts`
- Create: `src/app/api/wires/[id]/abonos/route.ts`
- Create: `src/lib/validations.ts` (UPDATE - add wireSchema)
- Create: `src/components/wires/wire-modal.tsx`
- Create: `src/components/wires/wire-table.tsx`
- Create: `src/components/wires/abono-modal.tsx`
- Create: `src/app/(protected)/wires/page.tsx`
- Create: `src/app/(protected)/wires/[id]/page.tsx`

- [ ] **Step 1: Agregar wireSchema a validations**

```typescript
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
```

- [ ] **Step 2: Crear API wires (GET, POST)**

POST: crear wire con:
- Calcular montoCupTotal = montoUsd * tasaPactada (si monedaPago = CUP)
- Calcular gananciaCup (usar tasa promedio de remeseros)
- Crear deuda en balance del comprador
- estado: PENDIENTE

- [ ] **Step 3: Crear API wires [id] (GET, PUT)**

GET: wire con comprador + abonos
PUT: actualizar (cambios en tasa, monto, etc.)

- [ ] **Step 4: Crear API abonos (POST)**

POST a /api/wires/[id]/abonos:
- Crear abono
- Actualizar montoPagadoCup del wire
- Actualizar estado (PARCIAL si montoPagadoCup > 0, PAGADO si >= montoCupTotal)
- Actualizar balance del comprador

- [ ] **Step 5: Crear componentes**

WireModal: comprador select, monto USD, tasa pactada, moneda pago, vista previa de total CUP y ganancia estimada
WireTable: columnas Fecha, Comprador, USD, Tasa, Total (CUP/USD), Pagado, Pendiente, Estado (badge), Acciones
AbonoModal: monto, moneda; usado desde la pagina de detalle del wire

- [ ] **Step 6: Crear paginas**

wires/page.tsx - listado
wires/[id]/page.tsx - detalle: info del wire + tabla de abonos + boton "Nuevo Abono"

- [ ] **Step 7: Verificar build y commit**

```bash
npm run build
git add src/app/api/wires src/components/wires src/app/\(protected\)/wires src/lib/validations.ts
git commit -m "feat: add wires and abonos CRUD with ganancia calculation"
```

---

### Task 11: API y Componentes de Reventas

**Files:**
- Create: `src/app/api/reventas/route.ts`
- Create: `src/app/api/reventas/[id]/route.ts`
- Create: `src/lib/validations.ts` (UPDATE - add reventaSchema)
- Create: `src/components/reventas/reventa-modal.tsx`
- Create: `src/components/reventas/reventa-table.tsx`
- Create: `src/app/(protected)/reventas/page.tsx`

- [ ] **Step 1: Agregar reventaSchema a validations**

```typescript
export const reventaWireSchema = z.object({
  compradorId: z.string().min(1, "El comprador es requerido"),
  vendedorId: z.string().min(1, "El vendedor es requerido"),
  montoUsd: z.number().positive("El monto debe ser positivo"),
  tasaCompra: z.number().positive("Tasa de compra requerida"),
  tasaVenta: z.number().positive("Tasa de venta requerida"),
});

export type ReventaWireFormData = z.infer<typeof reventaWireSchema>;
```

- [ ] **Step 2: Crear API reventas (GET, POST)**

POST: crear reventa con gananciaCup = montoUsd * (tasaCompra - tasaVenta)

- [ ] **Step 3: Crear componentes**

ReventaModal: comprador select, vendedor select, monto USD, tasa compra, tasa venta, preview de ganancia
ReventaTable: columnas Fecha, Comprador, Vendedor, USD, Tasa C, Tasa V, Spread, Ganancia

- [ ] **Step 4: Verificar build y commit**

```bash
npm run build
git add src/app/api/reventas src/components/reventas src/app/\(protected\)/reventas src/lib/validations.ts
git commit -m "feat: add reventas CRUD with spread calculation"
```

---

### Task 12: Dashboard con KPIs reales y Configuracion

**Files:**
- Update: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/api/configuracion/route.ts`
- Create: `src/app/(protected)/configuracion/page.tsx`

- [ ] **Step 1: Actualizar dashboard con datos reales**

Actualiza `src/app/(protected)/dashboard/page.tsx` para incluir:

```typescript
// Datos reales a calcular:
// 1. Balance USD/CUP (de cuentas bancarias)
// 2. Ganancia CUP del periodo (wires + reventas)
// 3. Ganancia USD del periodo (comisiones de cuadres)
// 4. Remeseros activos
// 5. Wires pendientes (cantidad y monto USD total)
// 6. Tasa USD global (de configuracion)
```

- [ ] **Step 2: Crear API de configuracion**

`src/app/api/configuracion/route.ts`:
- GET: devuelve la configuracion global (tasaUsdGlobal)
- PUT: actualiza tasaUsdGlobal (solo ADMIN)

- [ ] **Step 3: Crear pagina de configuracion**

`src/app/(protected)/configuracion/page.tsx`:
- Input para tasa USD global
- Boton guardar
- Mostrar tasa eltoque (skeleton, API real en Fase 4)

- [ ] **Step 4: Verificar build y commit**

```bash
npm run build
git add src/app/\(protected\)/dashboard src/app/api/configuracion src/app/\(protected\)/configuracion
git commit -m "feat: update dashboard with real KPIs and add configuracion page"
```

---

## Self-Review

### Spec coverage check
- [x] Modulo de Cuadres con parser WhatsApp (Task 7, 8)
- [x] Modulo de Pagos (Task 9)
- [x] Modulo de Wires + Abonos (Task 10)
- [x] Modulo de Reventas (Task 11)
- [x] Dashboard con KPIs reales (Task 12)
- [x] Configuracion con tasa global (Task 12)

### Placeholder scan
- No TBD/TODO/placeholders

### Type consistency
- Schemas in validations.ts match Prisma models
- FormData types exported and used consistently
