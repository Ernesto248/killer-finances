# Cuadres Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el guardado de cuadres, exponer la accion de revertir/eliminar desde la tabla y agregar busqueda de personas en el formulario de nuevo cuadre.

**Architecture:** El cambio se mantiene pequeno. La API de cuadres reemplaza el update con `increment` por un calculo explicito del nuevo balance USD para evitar el fallo de Prisma con `Decimal`. En frontend se reutilizan patrones existentes: `ConfirmDialog` para revertir y un input local para filtrar personas dentro del modal.

**Tech Stack:** Next.js 14, Prisma 7, React, react-hook-form, zod, Vitest, Testing Library.

---

### Task 1: Cubrir helpers puros con tests rojos

**Files:**
- Create: `src/lib/__tests__/cuadres.test.ts`
- Create: `src/lib/cuadres.ts`

- [ ] **Step 1: Escribir tests para balances y filtro**

Agregar tests para dos comportamientos:

```ts
import { describe, expect, it } from "vitest";
import { calculateUpdatedPersonaBalances, filterPersonaOptions } from "@/lib/cuadres";

describe("calculateUpdatedPersonaBalances", () => {
  it("sobrescribe balanceCup y acumula balanceUsd", () => {
    expect(
      calculateUpdatedPersonaBalances({
        currentBalanceUsd: 120,
        deudaFinalCup: 3500,
        totalZelleUsd: 45,
      })
    ).toEqual({ balanceCup: 3500, balanceUsd: 165 });
  });
});

describe("filterPersonaOptions", () => {
  it("filtra por nombre y alias sin distinguir mayusculas", () => {
    const personas = [
      { id: "1", nombre: "Maria Perez", alias: "mari" },
      { id: "2", nombre: "Carlos Diaz", alias: null },
    ];

    expect(filterPersonaOptions(personas, "MAR")).toHaveLength(1);
    expect(filterPersonaOptions(personas, "mari")[0]?.id).toBe("1");
  });
});
```

- [ ] **Step 2: Ejecutar tests y confirmar fallo inicial**

Run: `npm test -- src/lib/__tests__/cuadres.test.ts`
Expected: FAIL porque `@/lib/cuadres` aun no existe.

- [ ] **Step 3: Implementar helper minimo**

Crear `src/lib/cuadres.ts` con:

```ts
export interface PersonaSearchOption {
  id: string;
  nombre: string;
  alias: string | null;
}

export function calculateUpdatedPersonaBalances({
  currentBalanceUsd,
  deudaFinalCup,
  totalZelleUsd,
}: {
  currentBalanceUsd: number;
  deudaFinalCup: number;
  totalZelleUsd: number;
}) {
  return {
    balanceCup: deudaFinalCup,
    balanceUsd: currentBalanceUsd + totalZelleUsd,
  };
}

export function filterPersonaOptions(
  personas: PersonaSearchOption[],
  search: string
) {
  const term = search.trim().toLowerCase();
  if (!term) return personas;

  return personas.filter((persona) => {
    const nombre = persona.nombre.toLowerCase();
    const alias = persona.alias?.toLowerCase() ?? "";
    return nombre.includes(term) || alias.includes(term);
  });
}
```

- [ ] **Step 4: Ejecutar tests y confirmar verde**

Run: `npm test -- src/lib/__tests__/cuadres.test.ts`
Expected: PASS.

### Task 2: Corregir POST de cuadres

**Files:**
- Modify: `src/app/api/cuadres/route.ts`
- Modify: `src/lib/cuadres.ts`
- Test: `src/lib/__tests__/cuadres.test.ts`

- [ ] **Step 1: Usar helper puro en la ruta**

Cambiar el update de persona para leer el balance actual y escribir valores directos:

```ts
const personaActual = await tx.persona.findUnique({
  where: { id: data.personaId },
  select: { balanceUsd: true },
});

if (!personaActual) {
  const error = new Error("Persona no encontrada") as Error & { code?: string };
  error.code = "P2025";
  throw error;
}

const balances = calculateUpdatedPersonaBalances({
  currentBalanceUsd: Number(personaActual.balanceUsd ?? 0),
  deudaFinalCup: data.deudaFinalCup,
  totalZelleUsd: data.totalZelleUsd,
});

const persona = await tx.persona.update({
  where: { id: data.personaId },
  data: balances,
});
```

- [ ] **Step 2: Ejecutar tests del helper**

Run: `npm test -- src/lib/__tests__/cuadres.test.ts`
Expected: PASS.

### Task 3: Agregar accion de revertir desde la tabla

**Files:**
- Modify: `src/components/cuadres/cuadre-table.tsx`

- [ ] **Step 1: Reutilizar patron de acciones**

Agregar menu de acciones en desktop y boton secundario en mobile con `ConfirmDialog`, `fetch('/api/cuadres/${id}/revert', { method: 'DELETE' })` y refresco via `fetchCuadres()`.

- [ ] **Step 2: Mantener permisos y feedback**

Mostrar la accion solo cuando `userCanEdit` sea true y usar `toast.success("Cuadre revertido")` / `toast.error(...)`.

### Task 4: Agregar buscador al selector de personas

**Files:**
- Modify: `src/components/cuadres/cuadre-modal.tsx`
- Modify: `src/lib/cuadres.ts`

- [ ] **Step 1: Agregar estado de busqueda local**

Agregar `personaSearch` y limpiar ese estado al abrir el modal.

- [ ] **Step 2: Renderizar input de busqueda encima del listado**

Usar `Input` normal arriba del `SelectContent` y mapear `filterPersonaOptions(personas, personaSearch)` en ambos modos del formulario.

- [ ] **Step 3: Mostrar estado vacio**

Cuando no haya coincidencias, renderizar un texto corto: `No se encontraron personas`.

### Task 5: Verificacion final

**Files:**
- Test: `src/lib/__tests__/cuadres.test.ts`

- [ ] **Step 1: Ejecutar tests objetivos**

Run: `npm test -- src/lib/__tests__/cuadres.test.ts src/lib/__tests__/whatsapp-parser.test.ts src/lib/__tests__/validations.test.ts`
Expected: PASS.

- [ ] **Step 2: Ejecutar lint del area si aplica**

Run: `npm run lint`
Expected: sin errores nuevos del cambio o registrar cualquier warning existente si el repo ya los trae.
