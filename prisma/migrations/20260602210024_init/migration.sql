-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "alias" TEXT,
    "balance_usd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'REMESERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuadres" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    "deuda_inicial_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pagado_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deuda_final_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_zelle_usd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tasa_promedio_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuadres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_cuadre" (
    "id" TEXT NOT NULL,
    "cuadre_id" TEXT NOT NULL,
    "monto_usd" DECIMAL(65,30) NOT NULL,
    "tasa" DECIMAL(65,30) NOT NULL,
    "modalidad" TEXT NOT NULL DEFAULT 'TASA',
    "porcentaje_comision" DECIMAL(65,30),
    "monto_cup_resultante" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ganancia_usd" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "lineas_cuadre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "saldo_actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'BANCO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wires" (
    "id" TEXT NOT NULL,
    "comprador_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_usd" DECIMAL(65,30) NOT NULL,
    "tasa_pactada" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monto_cup_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monto_pagado_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda_pago" TEXT NOT NULL DEFAULT 'CUP',
    "porcentaje_comision" DECIMAL(65,30),
    "ganancia_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos_wire" (
    "id" TEXT NOT NULL,
    "wire_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',

    CONSTRAINT "abonos_wire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reventas_wire" (
    "id" TEXT NOT NULL,
    "comprador_id" TEXT NOT NULL,
    "vendedor_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_usd" DECIMAL(65,30) NOT NULL,
    "tasa_compra" DECIMAL(65,30) NOT NULL,
    "tasa_venta" DECIMAL(65,30) NOT NULL,
    "ganancia_cup" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deuda_comprador_pendiente" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deuda_vendedor_pendiente" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reventas_wire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costo_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda_costo" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_productos" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cantidad_vendida" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "lotes_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_ventas" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "precio_unitario" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',
    "persona_id" TEXT,

    CONSTRAINT "lotes_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CUP',
    "categoria" TEXT NOT NULL DEFAULT 'OTROS',
    "descripcion" TEXT,
    "lote_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "tasa_usd_global" DECIMAL(65,30) NOT NULL DEFAULT 600,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "cuadres" ADD CONSTRAINT "cuadres_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_cuadre" ADD CONSTRAINT "lineas_cuadre_cuadre_id_fkey" FOREIGN KEY ("cuadre_id") REFERENCES "cuadres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wires" ADD CONSTRAINT "wires_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_wire" ADD CONSTRAINT "abonos_wire_wire_id_fkey" FOREIGN KEY ("wire_id") REFERENCES "wires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reventas_wire" ADD CONSTRAINT "reventas_wire_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reventas_wire" ADD CONSTRAINT "reventas_wire_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_productos" ADD CONSTRAINT "lotes_productos_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_ventas" ADD CONSTRAINT "lotes_ventas_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_ventas" ADD CONSTRAINT "lotes_ventas_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
