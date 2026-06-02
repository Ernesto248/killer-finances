# Panel de Administracion Financiera — Diseno de Especificacion

## Resumen

Sistema web para administrar remesas (Zelle), venta de divisas (Wire), compra/venta de insumos, gastos operativos y cuentas bancarias, con soporte multi-moneda (USD/CUP), tasas de cambio variables y deudas entre el cliente y sus contrapartes (~70 remeseros, compradores, intermediarios).

El cliente actualmente opera con WhatsApp + Excel y necesita un sistema centralizado que minimice el error humano y le de control en tiempo real sobre balances, deudas y ganancias.

## Enfoque elegido

**Cuenta Corriente (Enfoque A):** Cada persona tiene un balance USD y un balance CUP. Las operaciones ajustan esos balances directamente. Simple, cercano al modelo mental del cliente.

## Stack tecnologico

- Next.js 14+ (App Router)
- PostgreSQL (Neon serverless)
- Prisma ORM
- NextAuth.js (autenticacion + roles)
- shadcn/ui (componentes)
- Tailwind CSS (estilos)
- Recharts (graficos)
- Tema oscuro por defecto con animaciones

## Modelo de Datos

### Persona
- id, nombre, telefono, alias
- balance_usd, balance_cup (positivo = debe al cliente, negativo = el cliente le debe)
- tipo: REMESERO | COMPRADOR | PROVEEDOR | INTERMEDIARIO (multivalor)
- activo: boolean
- createdAt, updatedAt

### Cuadre
- id, persona_id, fecha, nota
- deuda_inicial_cup
- pagado_cup (monto pagado desde el ultimo cuadre)
- deuda_final_cup (calculado)
- total_zelle_usd (suma de lineas tirado)
- tasa_promedio_cup (ponderada)
- LineasCuadre: monto_usd, tasa, modalidad (TASA | COMISION), porcentaje_comision, monto_cup_resultante, ganancia_usd

### Pago
- id, persona_id, fecha, monto, moneda (USD | CUP), descripcion

### CuentaBancaria
- id, nombre, moneda (USD | CUP), saldo_actual, tipo (ZELLE | EFECTIVO | BANCO)

### Wire
- id, comprador_id, fecha, monto_usd, tasa_pactada, monto_cup_total, monto_pagado_cup
- moneda_pago (CUP | USD), porcentaje_comision
- ganancia_cup, estado (PENDIENTE | PARCIAL | PAGADO)

### AbonoWire
- id, wire_id, fecha, monto, moneda

### ReventaWire
- id, comprador_id, vendedor_id, fecha, monto_usd, tasa_compra, tasa_venta
- ganancia_cup, deuda_comprador_pendiente, deuda_vendedor_pendiente

### Lote (Proyecto/Insumos)
- id, nombre, fecha_compra, costo_total, moneda_costo
- Productos: nombre, cantidad_total, cantidad_vendida, costo_unitario
- Ventas: fecha, cantidad, precio_unitario, moneda, persona_id
- Gastos asociados: monto, fecha, categoria, descripcion

### Gasto
- id, fecha, monto, moneda, categoria, descripcion, lote_id (opcional)

### Configuracion
- tasa_usd_global (manual, la define el cliente)
- tasa_eltoque (API, solo referencia visual)

### Usuario
- id, nombre, email, password_hash, rol (ADMIN | EDITOR | VISOR)

## Arquitectura de Rutas

### Paginas principales
| Ruta | Descripcion |
|---|---|
| `/dashboard` | Home con KPIs globales, graficos, accesos rapidos |
| `/personas` | Lista de todas las contrapartes |
| `/personas/[id]` | Detalle: balance, historial, cuadres |
| `/cuadres` | Historial de cuadres |
| `/cuadres/[id]` | Detalle de un cuadre |
| `/wires` | Lista de wires |
| `/wires/[id]` | Detalle de wire + abonos |
| `/reventas` | Historial de reventas |
| `/lotes` | Lista de lotes/proyectos |
| `/lotes/[id]` | Detalle: productos, ventas, gastos |
| `/gastos` | Lista de gastos operativos |
| `/cuentas-bancarias` | Gestion de cuentas y efectivo |
| `/configuracion` | Tasa global y config del sistema |
| `/usuarios` | Solo Admin |

### Modales (se abren desde cualquier pagina)
- Nuevo/Editar Cuadre, Pago, Wire, Reventa, Lote, Gasto, Persona, AbonoWire

## Flujos principales

### Flujo 1: Registrar un Cuadre
1. Modal con area de texto grande para pegar formato WhatsApp
2. Parser extrae: deuda inicial, pagado, lineas tirado (monto x tasa), deuda final
3. Validacion cruzada de calculos
4. Vista previa con resumen y tasa promedio ponderada
5. Seleccionar remesero, confirmar
6. Actualiza balances y guarda

Formato WhatsApp esperado:
```
🚩 INICIO
       $ 67.879 deuda
🪎 PAGADO
       $ 900,000
🇺🇲 TIRADO
           438 x 565
         2139 x 570
🚩 FINAL
       $ 634.579 deuda
```

### Flujo 2: Registrar un Pago
1. Modal simple: remesero, monto, moneda, descripcion
2. Guardar → descuenta del balance automaticamente

### Flujo 3: Registrar un Wire
1. Modal: comprador, monto USD, tasa pactada, moneda pago
2. Sistema calcula total a recibir + ganancia estimada
3. Guardar → crea deuda en cuenta del comprador

### Flujo 4: Abonar a un Wire
1. Desde detalle del wire → modal de abono
2. Monto + fecha → actualiza pendiente

### Flujo 5: Registrar una Reventa
1. Modal: comprador, vendedor, monto USD, tasas
2. Sistema calcula ganancia spread + deudas pendientes
3. Guardar

## Calculo de ganancias

### Por Wire
`monto_usd x (tasa_wire - tasa_promedio_remeseros)` = ganancia CUP

### Por Reventa
`monto_usd x (tasa_compra - tasa_venta)` = ganancia CUP

### Por Comision USD
`monto_usd x (porcentaje_comision / 100)` = ganancia USD

## Dashboard

### KPIs (filtrables por periodo)
- Balance USD (cuentas + deudas a cobrar - deudas a pagar)
- Balance CUP (idem)
- Ganancia CUP (spread wires + reventas)
- Ganancia USD (comisiones)
- Total remeseros activos
- Wires pendientes (cantidad y monto USD)

### Tarjeta tasa
- Tasa global USD (input editable)
- Tasa eltoque (referencia visual, solo lectura)

### Graficos
- Evolucion de ganancias (linea, 30 dias)
- Top 5 remeseros por Zelle recibido (barras)
- Composicion de deuda (donut)

### Accesos rapidos
Nuevo Cuadre | Nuevo Wire | Nueva Reventa | Nuevo Gasto

## Reportes

1. **Estado de cuenta por persona**: historial de cuadres/pagos en rango de fechas
2. **Wires pendientes**: tabla de wires no pagados totalmente
3. **Resumen de ganancias**: desglose mensual por tipo (wire, reventa, comision)

## Seguridad

| Rol | Permisos |
|---|---|
| Admin | Todo: CRUD completo + usuarios + configuracion |
| Editor | Crear/editar operaciones. No puede eliminar ni acceder a usuarios/config |
| Visor | Solo lectura en todo el sistema |

API routes protegidas con middleware de NextAuth.js + verificacion de rol.

## Diseno visual

- Tema oscuro (slate/gray 900-950) con acentos verde esmeralda
- Animaciones: transiciones de pagina, modales fade+scale, graficos animados, contadores numericos
- Skeleton loading en todos los estados de carga
- Mobile-first responsive: sidebar en desktop, navegacion inferior en movil
- Tablas con scroll horizontal en pantallas pequenas

## Plan de ejecucion

### Fase 1 — Fundacion
- Setup proyecto (Next.js + Prisma + shadcn/ui + NextAuth)
- Schema de base de datos completo
- Autenticacion + roles
- Layout base responsive con navegacion
- CRUD de Personas y Cuentas Bancarias

### Fase 2 — Operaciones principales
- Modulo de Cuadres (con parser WhatsApp)
- Modulo de Pagos
- Modulo de Wires + Abonos
- Modulo de Reventas
- Dashboard con KPIs

### Fase 3 — Negocios e insumos
- Modulo de Lotes/Proyectos
- Modulo de Gastos
- Vinculacion gastos ↔ lotes

### Fase 4 — Reportes y cierre
- Reportes (estado de cuenta, wires pendientes, ganancias)
- Exportacion a Excel
- API eltoque.com (referencia visual)
- Dashboard completo con graficos

### Fase 5 — Pulido
- Filtros por periodo en todas las vistas
- Animaciones y transiciones
- Validaciones y manejo de errores
- Pruebas
- Deploy
