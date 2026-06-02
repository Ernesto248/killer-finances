# Fase 1 — Fundacion: Plan de Implementacion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar el proyecto completo con Next.js 14, Prisma + PostgreSQL, NextAuth.js con roles, shadcn/ui tema oscuro, layout responsive, y CRUD basico de Personas y Cuentas Bancarias.

**Architecture:** Next.js App Router con grupo de rutas `(protected)` para todo el panel. Layout compartido con sidebar (desktop) y navegacion inferior (movil). Prisma como ORM unico. NextAuth.js con JWT + roles en el token. shadcn/ui sobre Tailwind con tema oscuro por defecto.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL (Neon), NextAuth.js v4, shadcn/ui, Tailwind CSS, zod (validaciones), bcryptjs

---

## Estructura de Archivos — Fase 1

```
src/
  app/
    globals.css
    layout.tsx                    -- root layout (ThemeProvider, SessionProvider)
    page.tsx                      -- redirect to /dashboard
    (protected)/
      layout.tsx                  -- sidebar + mobile nav + header
      dashboard/
        page.tsx                  -- KPIs skeleton (sin datos reales aun)
        loading.tsx               -- skeleton loading
      personas/
        page.tsx                  -- tabla listado
        [id]/
          page.tsx                -- detalle persona
      cuentas-bancarias/
        page.tsx                  -- tabla + modal crear/editar
    api/
      auth/
        [...nextauth]/
          route.ts                -- NextAuth handler
      personas/
        route.ts                  -- GET (list), POST (create)
        [id]/
          route.ts                -- GET, PUT, DELETE
      cuentas-bancarias/
        route.ts                  -- GET (list), POST (create)
        [id]/
          route.ts                -- GET, PUT, DELETE
  lib/
    prisma.ts                     -- singleton PrismaClient
    auth.ts                       -- NextAuth config (providers, callbacks)
    auth.config.ts                -- route protection + role check helpers
    utils.ts                      -- cn() helper, formatCurrency()
    validations.ts                -- zod schemas
  components/
    ui/                           -- shadcn/ui components
    layouts/
      sidebar.tsx
      mobile-nav.tsx
      header.tsx
      breadcrumb.tsx
    personas/
      persona-table.tsx
      persona-modal.tsx
      persona-detail.tsx
    cuentas/
      cuenta-table.tsx
      cuenta-modal.tsx
    dashboard/
      kpi-card.tsx
      quick-actions.tsx
    providers/
      theme-provider.tsx
      session-provider.tsx
    shared/
      confirm-dialog.tsx
  hooks/
    use-mobile.ts
  prisma/
    schema.prisma
    seed.ts
  middleware.ts                   -- NextAuth middleware for protected routes
  types/
    index.ts                      -- shared TypeScript types
.env
.env.example
next.config.js
tailwind.config.ts
tsconfig.json
package.json
```

---

### Task 1: Inicializar el proyecto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env`, `.env.example`

- [ ] **Step 1: Crear proyecto Next.js con create-next-app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Expected: Proyecto creado exitosamente.

- [ ] **Step 2: Instalar dependencias principales**

```bash
npm install prisma @prisma/client next-auth@4 bcryptjs zod
npm install -D @types/bcryptjs
```

Expected: Paquetes instalados en node_modules.

- [ ] **Step 3: Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: Crea `prisma/schema.prisma` y `.env` con DATABASE_URL.

- [ ] **Step 4: Instalar shadcn/ui**

```bash
npx shadcn@latest init -d
```

Especifica estas opciones cuando pregunte:
- Style: Default
- Base color: Slate
- Global CSS: src/app/globals.css
- CSS variables: Yes
- Prefix: (vacío)

Expected: `components.json` creado. Componentes base en `src/components/ui/`.

- [ ] **Step 5: Instalar componentes shadcn iniciales**

```bash
npx shadcn@latest add button input label card dialog table select dropdown-menu avatar badge separator sheet skeleton scroll-area form toast tabs
```

Expected: Componentes instalados en `src/components/ui/`.

- [ ] **Step 6: Instalar framer-motion para animaciones**

```bash
npm install framer-motion
```

Expected: framer-motion en package.json.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: initialize next.js project with prisma, shadcn/ui, nextauth"
```

---

### Task 2: Schema de base de datos completo

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Escribir el schema completo de Prisma**

Escribe `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("EDITOR") // ADMIN | EDITOR | VISOR
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Persona {
  id         String   @id @default(cuid())
  nombre     String
  telefono   String?
  alias      String?
  balanceUsd Decimal  @default(0) @map("balance_usd")
  balanceCup Decimal  @default(0) @map("balance_cup")
  tipo       String   @default("REMESERO") // REMESERO | COMPRADOR | PROVEEDOR | INTERMEDIARIO
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  cuadres    Cuadre[]
  pagos      Pago[]
  wiresComprados Wire[]     @relation("WireComprador")
  reventasCompradas ReventaWire[] @relation("ReventaComprador")
  reventasVendidas   ReventaWire[] @relation("ReventaVendedor")

  @@map("personas")
}

model Cuadre {
  id              String   @id @default(cuid())
  personaId       String   @map("persona_id")
  fecha           DateTime @default(now())
  nota            String?
  deudaInicialCup Decimal  @default(0) @map("deuda_inicial_cup")
  pagadoCup       Decimal  @default(0) @map("pagado_cup")
  deudaFinalCup   Decimal  @default(0) @map("deuda_final_cup")
  totalZelleUsd   Decimal  @default(0) @map("total_zelle_usd")
  tasaPromedioCup Decimal  @default(0) @map("tasa_promedio_cup")
  createdAt       DateTime @default(now()) @map("created_at")

  persona Persona        @relation(fields: [personaId], references: [id])
  lineas  LineaCuadre[]

  @@map("cuadres")
}

model LineaCuadre {
  id                String  @id @default(cuid())
  cuadreId          String  @map("cuadre_id")
  montoUsd          Decimal @map("monto_usd")
  tasa              Decimal
  modalidad         String  @default("TASA") // TASA | COMISION
  porcentajeComision Decimal? @map("porcentaje_comision")
  montoCupResultante Decimal @default(0) @map("monto_cup_resultante")
  gananciaUsd       Decimal @default(0) @map("ganancia_usd")

  cuadre Cuadre @relation(fields: [cuadreId], references: [id], onDelete: Cascade)

  @@map("lineas_cuadre")
}

model Pago {
  id          String   @id @default(cuid())
  personaId   String   @map("persona_id")
  fecha       DateTime @default(now())
  monto       Decimal
  moneda      String   @default("CUP") // CUP | USD
  descripcion String?
  createdAt   DateTime @default(now()) @map("created_at")

  persona Persona @relation(fields: [personaId], references: [id])

  @@map("pagos")
}

model CuentaBancaria {
  id           String   @id @default(cuid())
  nombre       String
  moneda       String   @default("USD") // USD | CUP
  saldoActual  Decimal  @default(0) @map("saldo_actual")
  tipo         String   @default("BANCO") // ZELLE | EFECTIVO | BANCO
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("cuentas_bancarias")
}

model Wire {
  id              String   @id @default(cuid())
  compradorId     String   @map("comprador_id")
  fecha           DateTime @default(now())
  montoUsd        Decimal  @map("monto_usd")
  tasaPactada     Decimal  @default(0) @map("tasa_pactada")
  montoCupTotal   Decimal  @default(0) @map("monto_cup_total")
  montoPagadoCup  Decimal  @default(0) @map("monto_pagado_cup")
  monedaPago      String   @default("CUP") @map("moneda_pago") // CUP | USD
  porcentajeComision Decimal? @map("porcentaje_comision")
  gananciaCup     Decimal  @default(0) @map("ganancia_cup")
  estado          String   @default("PENDIENTE") // PENDIENTE | PARCIAL | PAGADO
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  comprador Persona       @relation("WireComprador", fields: [compradorId], references: [id])
  abonos    AbonoWire[]

  @@map("wires")
}

model AbonoWire {
  id      String   @id @default(cuid())
  wireId  String   @map("wire_id")
  fecha   DateTime @default(now())
  monto   Decimal
  moneda  String   @default("CUP")

  wire Wire @relation(fields: [wireId], references: [id], onDelete: Cascade)

  @@map("abonos_wire")
}

model ReventaWire {
  id                      String   @id @default(cuid())
  compradorId             String   @map("comprador_id")
  vendedorId              String   @map("vendedor_id")
  fecha                   DateTime @default(now())
  montoUsd                Decimal  @map("monto_usd")
  tasaCompra              Decimal  @map("tasa_compra")
  tasaVenta               Decimal  @map("tasa_venta")
  gananciaCup             Decimal  @default(0) @map("ganancia_cup")
  deudaCompradorPendiente Decimal  @default(0) @map("deuda_comprador_pendiente")
  deudaVendedorPendiente  Decimal  @default(0) @map("deuda_vendedor_pendiente")
  createdAt               DateTime @default(now()) @map("created_at")

  comprador Persona @relation("ReventaComprador", fields: [compradorId], references: [id])
  vendedor  Persona @relation("ReventaVendedor", fields: [vendedorId], references: [id])

  @@map("reventas_wire")
}

model Lote {
  id          String   @id @default(cuid())
  nombre      String
  fechaCompra DateTime @default(now()) @map("fecha_compra")
  costoTotal  Decimal  @default(0) @map("costo_total")
  monedaCosto String   @default("USD") @map("moneda_costo")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  productos LoteProducto[]
  ventas    LoteVenta[]
  gastos    Gasto[]

  @@map("lotes")
}

model LoteProducto {
  id              String  @id @default(cuid())
  loteId          String  @map("lote_id")
  nombre          String
  cantidadTotal   Decimal @default(0) @map("cantidad_total")
  cantidadVendida Decimal @default(0) @map("cantidad_vendida")
  costoUnitario   Decimal @default(0) @map("costo_unitario")

  lote Lote @relation(fields: [loteId], references: [id], onDelete: Cascade)

  @@map("lotes_productos")
}

model LoteVenta {
  id            String   @id @default(cuid())
  loteId        String   @map("lote_id")
  fecha         DateTime @default(now())
  cantidad      Decimal  @default(0)
  precioUnitario Decimal @default(0) @map("precio_unitario")
  moneda        String   @default("CUP")
  personaId     String?  @map("persona_id")

  lote    Lote     @relation(fields: [loteId], references: [id], onDelete: Cascade)
  persona Persona? @relation(fields: [personaId], references: [id])

  @@map("lotes_ventas")
}

model Gasto {
  id          String   @id @default(cuid())
  fecha       DateTime @default(now())
  monto       Decimal
  moneda      String   @default("CUP")
  categoria   String   @default("OTROS") // SERVICIOS | SALARIOS | LOGISTICA | IMPREVISTOS | OTROS
  descripcion String?
  loteId      String?  @map("lote_id")
  createdAt   DateTime @default(now()) @map("created_at")

  lote Lote? @relation(fields: [loteId], references: [id], onDelete: SetNull)

  @@map("gastos")
}

model Configuracion {
  id             String @id @default("global")
  tasaUsdGlobal  Decimal @default(600) @map("tasa_usd_global")

  @@map("configuracion")
}
```

- [ ] **Step 2: Crear el archivo .env con variables**

Escribe `.env`:

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Escribe `.env.example`:

```
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 3: Ejecutar migracion inicial**

```bash
npx prisma migrate dev --name init
```

Expected: Migracion creada, tablas en la base de datos.

- [ ] **Step 4: Crear seed con datos de prueba**

Crea `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@finanzas.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@finanzas.com",
      password,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@finanzas.com" },
    update: {},
    create: {
      name: "Editor",
      email: "editor@finanzas.com",
      password: await bcrypt.hash("editor123", 10),
      role: "EDITOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "visor@finanzas.com" },
    update: {},
    create: {
      name: "Visor",
      email: "visor@finanzas.com",
      password: await bcrypt.hash("visor123", 10),
      role: "VISOR",
    },
  });

  await prisma.configuracion.upsert({
    where: { id: "global" },
    update: {},
    create: { tasaUsdGlobal: 600 },
  });

  await prisma.persona.createMany({
    data: [
      { nombre: "Juan Perez", alias: "juanpe", tipo: "REMESERO" },
      { nombre: "Maria Lopez", alias: "marilo", tipo: "REMESERO" },
      { nombre: "Carlos Ruiz", alias: "carlosr", tipo: "COMPRADOR" },
    ],
    skipDuplicates: true,
  });

  await prisma.cuentaBancaria.createMany({
    data: [
      { nombre: "Wells Fargo Zelle", moneda: "USD", tipo: "ZELLE" },
      { nombre: "Bank of America", moneda: "USD", tipo: "BANCO" },
      { nombre: "Efectivo CUP", moneda: "CUP", tipo: "EFECTIVO" },
      { nombre: "Efectivo USD", moneda: "USD", tipo: "EFECTIVO" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Agrega a `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 5: Instalar tsx para el seed**

```bash
npm install -D tsx
```

- [ ] **Step 6: Ejecutar seed**

```bash
npx prisma db seed
```

Expected: Datos de prueba insertados.

- [ ] **Step 7: Generar cliente Prisma y verificar**

```bash
npx prisma generate
```

Expected: Cliente generado sin errores.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts .env .env.example package.json
git commit -m "feat: add complete prisma schema and seed data"
```

---

### Task 3: Configuracion de NextAuth con roles

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.config.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Crear el singleton de Prisma**

Crea `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Crear tipos compartidos**

Crea `src/types/index.ts`:

```typescript
export type UserRole = "ADMIN" | "EDITOR" | "VISOR";

export type PersonaTipo = "REMESERO" | "COMPRADOR" | "PROVEEDOR" | "INTERMEDIARIO";

export type Moneda = "USD" | "CUP";

export type CuentaTipo = "ZELLE" | "EFECTIVO" | "BANCO";

export type WireEstado = "PENDIENTE" | "PARCIAL" | "PAGADO";

export type CuadreModalidad = "TASA" | "COMISION";
```

- [ ] **Step 3: Crear auth.config.ts con reglas de acceso**

Crea `src/lib/auth.config.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contrasena requeridos");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Credenciales invalidas");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Credenciales invalidas");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

- [ ] **Step 4: Crear auth.ts con helpers de autorizacion**

Crea `src/lib/auth.ts`:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import type { UserRole } from "@/types";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("No autorizado");
  }
  return user;
}

export function canEdit(role: UserRole): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}
```

- [ ] **Step 5: Crear el handler de NextAuth**

Crea `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth.config";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 6: Crear middleware de proteccion de rutas**

Crea `src/middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/usuarios") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/configuracion") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/prisma.ts src/lib/auth.config.ts src/lib/auth.ts src/app/api src/types/index.ts src/middleware.ts
git commit -m "feat: add nextauth configuration with role-based access"
```

---

### Task 4: Layout base con tema oscuro y navegacion responsive

**Files:**
- Create: `src/hooks/use-mobile.ts`
- Create: `src/components/providers/theme-provider.tsx`
- Create: `src/components/providers/session-provider.tsx`
- Create: `src/components/layouts/sidebar.tsx`
- Create: `src/components/layouts/mobile-nav.tsx`
- Create: `src/components/layouts/header.tsx`
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/(protected)/dashboard/loading.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Crear hook useMobile**

Crea `src/hooks/use-mobile.ts`:

```typescript
import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
```

- [ ] **Step 2: Crear ThemeProvider**

Crea `src/components/providers/theme-provider.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 3: Crear SessionProvider**

Crea `src/components/providers/session-provider.tsx`:

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 4: Escribir globals.css con tema oscuro**

Crea `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 160 84% 39%;
  --primary-foreground: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 160 84% 39%;
  --radius: 0.5rem;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Configurar root layout**

Crea `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Panel Financiero",
  description: "Sistema de administracion financiera",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Crear pagina de login**

Crea `src/app/login/page.tsx`:

```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Credenciales invalidas");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Panel Financiero</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@finanzas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 7: Crear el sidebar**

Crea `src/components/layouts/sidebar.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ArrowRightLeft,
  Repeat,
  Package,
  DollarSign,
  Building2,
  Settings,
  Shield,
} from "lucide-react";
import { isAdmin } from "@/lib/auth";
import type { UserRole } from "@/types";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Personas", href: "/personas", icon: Users, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Cuadres", href: "/cuadres", icon: ClipboardList, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Wires", href: "/wires", icon: ArrowRightLeft, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Reventas", href: "/reventas", icon: Repeat, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Lotes", href: "/lotes", icon: Package, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Gastos", href: "/gastos", icon: DollarSign, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Cuentas", href: "/cuentas-bancarias", icon: Building2, roles: ["ADMIN", "EDITOR", "VISOR"] },
  { name: "Configuracion", href: "/configuracion", icon: Settings, roles: ["ADMIN"] },
  { name: "Usuarios", href: "/usuarios", icon: Shield, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const filteredNav = navigation.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-lg font-bold text-primary">Finanzas</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 8: Crear navegacion movil**

Crea `src/components/layouts/mobile-nav.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ArrowRightLeft,
} from "lucide-react";
import type { UserRole } from "@/types";

const mobileNav = [
  { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Cuadres", href: "/cuadres", icon: ClipboardList },
  { name: "Wires", href: "/wires", icon: ArrowRightLeft },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  if (!role) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="flex items-center justify-around h-16">
        {mobileNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 9: Crear header con user menu**

Crea `src/components/layouts/header.tsx`:

```typescript
"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-primary md:hidden">Finanzas</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm">
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 10: Crear (protected) layout con sidebar + header + mobile nav**

Crea `src/app/(protected)/layout.tsx`:

```typescript
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { MobileNav } from "@/components/layouts/mobile-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
```

- [ ] **Step 11: Crear dashboard skeleton y loading**

Crea `src/app/(protected)/dashboard/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    totalPersonas,
    totalPersonasActivas,
    cuentasUsd,
    cuentasCup,
  ] = await Promise.all([
    prisma.persona.count(),
    prisma.persona.count({ where: { activo: true } }),
    prisma.cuentaBancaria.aggregate({
      where: { moneda: "USD" },
      _sum: { saldoActual: true },
    }),
    prisma.cuentaBancaria.aggregate({
      where: { moneda: "CUP" },
      _sum: { saldoActual: true },
    }),
  ]);

  const kpis = [
    {
      title: "Balance USD",
      value: `$${cuentasUsd._sum.saldoActual?.toLocaleString() || "0"}`,
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Balance CUP",
      value: `${cuentasCup._sum.saldoActual?.toLocaleString() || "0"} CUP`,
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Remeseros Activos",
      value: totalPersonasActivas.toString(),
      icon: Users,
      trend: `de ${totalPersonas} total`,
    },
    {
      title: "Wires Pendientes",
      value: "—",
      icon: Clock,
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general de tus finanzas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.trend && (
                <p className="text-xs text-muted-foreground">{kpi.trend}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tasa USD Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Configurala en /configuracion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tasa elTOQUE (Referencia)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              API pendiente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Crear dashboard loading**

Crea `src/app/(protected)/dashboard/loading.tsx`:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 13: Crear pagina raiz con redirect**

Crea `src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 14: Crear helper utils.ts**

Crea `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "USD" | "CUP"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " CUP";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
```

- [ ] **Step 15: Verificar compilacion y commit**

```bash
npm run build
```

Corrige cualquier error de build. Luego:

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx src/app/login src/app/(protected) src/hooks src/components src/lib/utils.ts
git commit -m "feat: add dark theme layout with sidebar, mobile nav, and dashboard skeleton"
```

---

### Task 5: CRUD de Personas con API routes, tabla y modal

**Files:**
- Create: `src/lib/validations.ts`
- Create: `src/app/api/personas/route.ts`
- Create: `src/app/api/personas/[id]/route.ts`
- Create: `src/components/personas/persona-table.tsx`
- Create: `src/components/personas/persona-modal.tsx`
- Create: `src/app/(protected)/personas/page.tsx`
- Create: `src/app/(protected)/personas/[id]/page.tsx`
- Create: `src/components/shared/confirm-dialog.tsx`

- [ ] **Step 1: Crear esquemas de validacion zod**

Crea `src/lib/validations.ts`:

```typescript
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
```

- [ ] **Step 2: Crear API personas GET (list) y POST (create)**

Crea `src/app/api/personas/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { personaSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(personas);
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
    const data = personaSchema.parse(body);

    const persona = await prisma.persona.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono ?? null,
        alias: data.alias ?? null,
        tipo: data.tipo,
        activo: data.activo,
        balanceUsd: data.balanceUsd ?? 0,
        balanceCup: data.balanceCup ?? 0,
      },
    });

    return NextResponse.json(persona, { status: 201 });
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

- [ ] **Step 3: Crear API personas [id] GET, PUT, DELETE**

Crea `src/app/api/personas/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { personaSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const persona = await prisma.persona.findUnique({
      where: { id: params.id },
      include: {
        cuadres: { orderBy: { fecha: "desc" }, take: 20 },
        pagos: { orderBy: { fecha: "desc" }, take: 20 },
        wiresComprados: { orderBy: { fecha: "desc" }, take: 10 },
      },
    });
    if (!persona) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(persona);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = personaSchema.parse(body);

    const persona = await prisma.persona.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        telefono: data.telefono ?? null,
        alias: data.alias ?? null,
        tipo: data.tipo,
        activo: data.activo,
        balanceUsd: data.balanceUsd ?? 0,
        balanceCup: data.balanceCup ?? 0,
      },
    });

    return NextResponse.json(persona);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN");
    await prisma.persona.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
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

- [ ] **Step 4: Crear componente ConfirmDialog**

Crea `src/components/shared/confirm-dialog.tsx`:

```typescript
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Crear componente persona-modal**

Crea `src/components/personas/persona-modal.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { personaSchema, type PersonaFormData } from "@/lib/validations";
import type { PersonaTipo } from "@/types";

interface PersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PersonaFormData) => void;
  defaultValues?: Partial<PersonaFormData>;
  title: string;
}

const TIPO_OPTIONS: { value: PersonaTipo; label: string }[] = [
  { value: "REMESERO", label: "Remesero" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "INTERMEDIARIO", label: "Intermediario" },
];

export function PersonaModal({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
}: PersonaModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      alias: "",
      tipo: "REMESERO",
      activo: true,
      balanceUsd: 0,
      balanceCup: 0,
      ...defaultValues,
    },
  });

  const activo = watch("activo");

  useEffect(() => {
    if (open) {
      reset({
        nombre: "",
        telefono: "",
        alias: "",
        tipo: "REMESERO",
        activo: true,
        balanceUsd: 0,
        balanceCup: 0,
        ...defaultValues,
      });
    }
  }, [open, defaultValues, reset]);

  const onFormSubmit = (data: PersonaFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completa los datos de la persona.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register("nombre")} placeholder="Nombre completo" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" {...register("alias")} placeholder="Apodo o identificador" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" {...register("telefono")} placeholder="+53 5..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <select
              id="tipo"
              {...register("tipo")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balanceUsd">Balance Inicial USD</Label>
              <Input
                id="balanceUsd"
                type="number"
                step="0.01"
                {...register("balanceUsd", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceCup">Balance Inicial CUP</Label>
              <Input
                id="balanceCup"
                type="number"
                step="0.01"
                {...register("balanceCup", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="activo"
              checked={activo}
              onCheckedChange={(checked) => setValue("activo", checked)}
            />
            <Label htmlFor="activo">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Instalar react-hook-form y @hookform/resolvers**

```bash
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 7: Crear componente persona-table**

Crea `src/components/personas/persona-table.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PersonaModal } from "./persona-modal";
import { canEdit } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { PersonaFormData } from "@/lib/validations";
import type { UserRole } from "@/types";
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Persona {
  id: string;
  nombre: string;
  alias: string | null;
  telefono: string | null;
  tipo: string;
  activo: boolean;
  balanceUsd: number;
  balanceCup: number;
}

interface PersonaTableProps {
  personas: Persona[];
  userRole: UserRole;
  onCreate: (data: PersonaFormData) => Promise<void>;
  onUpdate: (id: string, data: PersonaFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PersonaTable({
  personas: initialPersonas,
  userRole,
  onCreate,
  onUpdate,
  onDelete,
}: PersonaTableProps) {
  const [personas, setPersonas] = useState(initialPersonas);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = personas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.alias?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const handleCreate = async (data: PersonaFormData) => {
    await onCreate(data);
    // Refetch handled by parent via router.refresh
    window.location.reload();
  };

  const handleUpdate = async (id: string, data: PersonaFormData) => {
    await onUpdate(id, data);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteId(null);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar persona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canEdit(userRole) && (
          <Button onClick={() => { setEditingPersona(null); setModalOpen(true); }}>
            Nueva Persona
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Balance USD</TableHead>
              <TableHead className="text-right">Balance CUP</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron personas
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((persona) => (
                  <motion.tr
                    key={persona.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <TableCell>
                      <Link
                        href={`/personas/${persona.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {persona.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {persona.alias || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{persona.tipo}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        Number(persona.balanceUsd) > 0
                          ? "text-emerald-400"
                          : Number(persona.balanceUsd) < 0
                          ? "text-red-400"
                          : ""
                      }`}
                    >
                      {formatCurrency(Number(persona.balanceUsd), "USD")}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        Number(persona.balanceCup) > 0
                          ? "text-emerald-400"
                          : Number(persona.balanceCup) < 0
                          ? "text-red-400"
                          : ""
                      }`}
                    >
                      {formatCurrency(Number(persona.balanceCup), "CUP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={persona.activo ? "default" : "secondary"}>
                        {persona.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit(userRole) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPersona(persona);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {userRole === "ADMIN" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(persona.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <PersonaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={
          editingPersona
            ? (data) => handleUpdate(editingPersona.id, data)
            : handleCreate
        }
        defaultValues={
          editingPersona
            ? {
                nombre: editingPersona.nombre,
                alias: editingPersona.alias,
                telefono: editingPersona.telefono,
                tipo: editingPersona.tipo as any,
                activo: editingPersona.activo,
                balanceUsd: Number(editingPersona.balanceUsd),
                balanceCup: Number(editingPersona.balanceCup),
              }
            : undefined
        }
        title={editingPersona ? "Editar Persona" : "Nueva Persona"}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Persona"
        description="Esta accion no se puede deshacer. Se eliminara la persona permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
      />
    </div>
  );
}
```

- [ ] **Step 8: Crear pagina de listado de personas**

Crea `src/app/(protected)/personas/page.tsx`:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PersonaTableClient } from "./persona-table-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function PersonasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const personas = await prisma.persona.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personas</h2>
        <p className="text-muted-foreground">
          Gestiona remeseros, compradores, proveedores y mas.
        </p>
      </div>
      <PersonaTableClient personas={personas} userRole={user.role} />
    </div>
  );
}
```

- [ ] **Step 9: Crear client component wrapper para la tabla**

Crea `src/app/(protected)/personas/persona-table-client.tsx`:

```typescript
"use client";

import { PersonaTable } from "@/components/personas/persona-table";
import type { PersonaFormData } from "@/lib/validations";
import type { UserRole } from "@/types";

interface Persona {
  id: string;
  nombre: string;
  alias: string | null;
  telefono: string | null;
  tipo: string;
  activo: boolean;
  balanceUsd: number;
  balanceCup: number;
}

interface Props {
  personas: Persona[];
  userRole: UserRole;
}

export function PersonaTableClient({ personas, userRole }: Props) {
  const handleCreate = async (data: PersonaFormData) => {
    await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const handleUpdate = async (id: string, data: PersonaFormData) => {
    await fetch(`/api/personas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/personas/${id}`, {
      method: "DELETE",
    });
  };

  return (
    <PersonaTable
      personas={personas}
      userRole={userRole}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
```

- [ ] **Step 10: Crear pagina de detalle de persona**

Crea `src/app/(protected)/personas/[id]/page.tsx`:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default async function PersonaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: {
      cuadres: { orderBy: { fecha: "desc" }, take: 20 },
      pagos: { orderBy: { fecha: "desc" }, take: 20 },
      wiresComprados: {
        orderBy: { fecha: "desc" },
        take: 10,
        where: { estado: { not: "PAGADO" } },
      },
    },
  });

  if (!persona) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{persona.nombre}</h2>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <Badge variant="outline">{persona.tipo}</Badge>
          {persona.alias && <span className="text-sm">@{persona.alias}</span>}
          {persona.telefono && (
            <span className="text-sm">{persona.telefono}</span>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance USD</CardTitle>
            {Number(persona.balanceUsd) > 0 ? (
              <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
            ) : Number(persona.balanceUsd) < 0 ? (
              <ArrowDownCircle className="h-4 w-4 text-red-400" />
            ) : null}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                Number(persona.balanceUsd) > 0
                  ? "text-emerald-400"
                  : Number(persona.balanceUsd) < 0
                  ? "text-red-400"
                  : ""
              }`}
            >
              {formatCurrency(Number(persona.balanceUsd), "USD")}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(persona.balanceUsd) > 0
                ? "Te debe"
                : Number(persona.balanceUsd) < 0
                ? "Le debes"
                : "Balance en cero"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance CUP</CardTitle>
            {Number(persona.balanceCup) > 0 ? (
              <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
            ) : Number(persona.balanceCup) < 0 ? (
              <ArrowDownCircle className="h-4 w-4 text-red-400" />
            ) : null}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                Number(persona.balanceCup) > 0
                  ? "text-emerald-400"
                  : Number(persona.balanceCup) < 0
                  ? "text-red-400"
                  : ""
              }`}
            >
              {formatCurrency(Number(persona.balanceCup), "CUP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(persona.balanceCup) > 0
                ? "Te debe"
                : Number(persona.balanceCup) < 0
                ? "Le debes"
                : "Balance en cero"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ultimos Cuadres</h3>
        {persona.cuadres.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay cuadres registrados.</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Zelle USD</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Tasa Prom.</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Deuda Final</th>
                </tr>
              </thead>
              <tbody>
                {persona.cuadres.map((cuadre) => (
                  <tr key={cuadre.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm">
                      {new Date(cuadre.fecha).toLocaleDateString("es-CU")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatCurrency(Number(cuadre.totalZelleUsd), "USD")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatNumber(Number(cuadre.tasaPromedioCup))}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatCurrency(Number(cuadre.deudaFinalCup), "CUP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ultimos Pagos</h3>
        {persona.pagos.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay pagos registrados.</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Monto</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                {persona.pagos.map((pago) => (
                  <tr key={pago.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm">
                      {new Date(pago.fecha).toLocaleDateString("es-CU")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-red-400">
                      {formatCurrency(Number(pago.monto), pago.moneda as "USD" | "CUP")}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {pago.descripcion || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {persona.wiresComprados.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Wires Pendientes</h3>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">USD</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Tasa</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Pendiente</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {persona.wiresComprados.map((wire) => (
                  <tr key={wire.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm">
                      {new Date(wire.fecha).toLocaleDateString("es-CU")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatCurrency(Number(wire.montoUsd), "USD")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatNumber(Number(wire.tasaPactada))}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatCurrency(
                        Number(wire.montoCupTotal) - Number(wire.montoPagadoCup),
                        "CUP"
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <Badge
                        variant={
                          wire.estado === "PAGADO"
                            ? "default"
                            : wire.estado === "PARCIAL"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {wire.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 11: Verificar compilacion**

```bash
npm run build
```

Corrige errores. Luego:

- [ ] **Step 12: Commit**

```bash
git add src/lib/validations.ts src/app/api/personas src/components/personas src/components/shared src/app/\(protected\)/personas
git commit -m "feat: add personas CRUD with table, modal, and detail page"
```

---

### Task 6: CRUD de Cuentas Bancarias

**Files:**
- Create: `src/app/api/cuentas-bancarias/route.ts`
- Create: `src/app/api/cuentas-bancarias/[id]/route.ts`
- Create: `src/components/cuentas/cuenta-table.tsx`
- Create: `src/components/cuentas/cuenta-modal.tsx`
- Create: `src/app/(protected)/cuentas-bancarias/page.tsx`

- [ ] **Step 1: Crear API cuentas GET y POST**

Crea `src/app/api/cuentas-bancarias/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { cuentaBancariaSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireRole("ADMIN", "EDITOR", "VISOR");
    const cuentas = await prisma.cuentaBancaria.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cuentas);
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
    const data = cuentaBancariaSchema.parse(body);

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        nombre: data.nombre,
        moneda: data.moneda,
        saldoActual: data.saldoActual,
        tipo: data.tipo,
      },
    });

    return NextResponse.json(cuenta, { status: 201 });
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

- [ ] **Step 2: Crear API cuentas [id] GET, PUT, DELETE**

Crea `src/app/api/cuentas-bancarias/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { cuentaBancariaSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const body = await req.json();
    const data = cuentaBancariaSchema.parse(body);

    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        moneda: data.moneda,
        saldoActual: data.saldoActual,
        tipo: data.tipo,
      },
    });

    return NextResponse.json(cuenta);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("ADMIN");
    await prisma.cuentaBancaria.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
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

- [ ] **Step 3: Crear componente cuenta-modal**

Crea `src/components/cuentas/cuenta-modal.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cuentaBancariaSchema, type CuentaBancariaFormData } from "@/lib/validations";
import type { CuentaTipo, Moneda } from "@/types";

interface CuentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CuentaBancariaFormData) => void;
  defaultValues?: Partial<CuentaBancariaFormData>;
  title: string;
}

const TIPO_OPTIONS: { value: CuentaTipo; label: string }[] = [
  { value: "ZELLE", label: "Zelle" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "BANCO", label: "Banco" },
];

const MONEDA_OPTIONS: { value: Moneda; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "CUP", label: "CUP" },
];

export function CuentaModal({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
}: CuentaModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CuentaBancariaFormData>({
    resolver: zodResolver(cuentaBancariaSchema),
    defaultValues: {
      nombre: "",
      moneda: "USD",
      saldoActual: 0,
      tipo: "BANCO",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: "",
        moneda: "USD",
        saldoActual: 0,
        tipo: "BANCO",
        ...defaultValues,
      });
    }
  }, [open, defaultValues, reset]);

  const onFormSubmit = (data: CuentaBancariaFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Registra una cuenta bancaria o efectivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register("nombre")} placeholder="Wells Fargo" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                {...register("tipo")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <select
                id="moneda"
                {...register("moneda")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MONEDA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="saldoActual">Saldo Actual</Label>
            <Input
              id="saldoActual"
              type="number"
              step="0.01"
              {...register("saldoActual", { valueAsNumber: true })}
            />
            {errors.saldoActual && (
              <p className="text-sm text-destructive">{errors.saldoActual.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Crear componente cuenta-table**

Crea `src/components/cuentas/cuenta-table.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CuentaModal } from "./cuenta-modal";
import { canEdit } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { CuentaBancariaFormData } from "@/lib/validations";
import type { UserRole } from "@/types";
import { MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";

interface Cuenta {
  id: string;
  nombre: string;
  moneda: string;
  saldoActual: number;
  tipo: string;
}

interface CuentaTableProps {
  cuentas: Cuenta[];
  userRole: UserRole;
}

export function CuentaTable({ cuentas, userRole }: CuentaTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: CuentaBancariaFormData) => {
    await fetch("/api/cuentas-bancarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    window.location.reload();
  };

  const handleUpdate = async (id: string, data: CuentaBancariaFormData) => {
    await fetch(`/api/cuentas-bancarias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/cuentas-bancarias/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    window.location.reload();
  };

  const totalUsd = cuentas
    .filter((c) => c.moneda === "USD")
    .reduce((sum, c) => sum + Number(c.saldoActual), 0);
  const totalCup = cuentas
    .filter((c) => c.moneda === "CUP")
    .reduce((sum, c) => sum + Number(c.saldoActual), 0);

  const tipoBadgeVariant = (tipo: string) => {
    if (tipo === "ZELLE") return "default";
    if (tipo === "EFECTIVO") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4 bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Wallet className="h-4 w-4" />
            Total USD
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalUsd, "USD")}</div>
        </div>
        <div className="rounded-md border p-4 bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Wallet className="h-4 w-4" />
            Total CUP
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCup, "CUP")}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div />
        {canEdit(userRole) && (
          <Button onClick={() => { setEditingCuenta(null); setModalOpen(true); }}>
            Nueva Cuenta
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cuentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay cuentas registradas
                </TableCell>
              </TableRow>
            ) : (
              cuentas.map((cuenta) => (
                <TableRow key={cuenta.id}>
                  <TableCell className="font-medium">{cuenta.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={tipoBadgeVariant(cuenta.tipo)}>{cuenta.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cuenta.moneda === "USD" ? "default" : "secondary"}>
                      {cuenta.moneda}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(Number(cuenta.saldoActual), cuenta.moneda as "USD" | "CUP")}
                  </TableCell>
                  <TableCell>
                    {canEdit(userRole) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => { setEditingCuenta(cuenta); setModalOpen(true); }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {userRole === "ADMIN" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(cuenta.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CuentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={
          editingCuenta
            ? (data) => handleUpdate(editingCuenta.id, data)
            : handleCreate
        }
        defaultValues={
          editingCuenta
            ? {
                nombre: editingCuenta.nombre,
                moneda: editingCuenta.moneda as "USD" | "CUP",
                saldoActual: Number(editingCuenta.saldoActual),
                tipo: editingCuenta.tipo as "ZELLE" | "EFECTIVO" | "BANCO",
              }
            : undefined
        }
        title={editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Cuenta"
        description="Se eliminara la cuenta permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
      />
    </div>
  );
}
```

- [ ] **Step 5: Crear pagina de cuentas bancarias**

Crea `src/app/(protected)/cuentas-bancarias/page.tsx`:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CuentaTable } from "@/components/cuentas/cuenta-table";
import { redirect } from "next/navigation";

export default async function CuentasBancariasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cuentas = await prisma.cuentaBancaria.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas Bancarias</h2>
        <p className="text-muted-foreground">
          Gestiona tus cuentas Zelle, bancarias y efectivo.
        </p>
      </div>
      <CuentaTable cuentas={cuentas} userRole={user.role} />
    </div>
  );
}
```

- [ ] **Step 6: Verificar compilacion y commit**

```bash
npm run build
```

Corrige errores. Luego:

```bash
git add src/app/api/cuentas-bancarias src/components/cuentas src/app/\(protected\)/cuentas-bancarias
git commit -m "feat: add cuentas bancarias CRUD with table, modal, and totals"
```

---

## Self-Review

### Spec coverage check
- [x] Schema de base de datos completo (Task 2)
- [x] Autenticacion + roles (Task 3)
- [x] Layout base responsive con navegacion (Task 4)
- [x] CRUD de Personas (Task 5)
- [x] CRUD de Cuentas Bancarias (Task 6)
- [ ] Dashboard con KPIs - funcional con datos basicos (Task 4 Step 11)
- [ ] Tema oscuro (Task 4 Steps 2,4,5)
- [ ] Animaciones (framer-motion en login y tabla)

### Placeholder scan
- No hay TBD, TODO, ni placeholders
- Todo el codigo esta completo en cada step

### Type consistency
- `PersonaFormData` usado consistente en validations, modal, y API
- `CuentaBancariaFormData` usado consistente en validations, modal, y API
- `UserRole`, `PersonaTipo`, `CuentaTipo`, `Moneda` consistentes entre types y componentes
