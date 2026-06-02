"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VentaModal } from "./venta-modal";
import { formatCurrency } from "@/lib/utils";

interface Producto {
  id: string;
  nombre: string;
  cantidadTotal: number | { $numberDecimal?: string } | string;
  cantidadVendida: number | { $numberDecimal?: string } | string;
  costoUnitario: number | { $numberDecimal?: string } | string;
}

interface Venta {
  id: string;
  fecha: string;
  cantidad: number | { $numberDecimal?: string } | string;
  precioUnitario: number | { $numberDecimal?: string } | string;
  moneda: string;
  persona: { id: string; nombre: string } | null;
}

function toNumber(val: number | { $numberDecimal?: string } | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (val && typeof val === "object" && val.$numberDecimal)
    return Number(val.$numberDecimal);
  return 0;
}

interface VentasSectionProps {
  loteId: string;
  productos: Producto[];
  ventas: Venta[];
}

export function VentasSection({
  loteId,
  productos,
  ventas: initialVentas,
}: VentasSectionProps) {
  const [ventas, setVentas] = useState<Venta[]>(initialVentas);
  const [modalOpen, setModalOpen] = useState(false);

  const refreshVentas = useCallback(async () => {
    try {
      const res = await fetch(`/api/lotes/${loteId}/ventas`);
      if (res.ok) {
        const data = await res.json();
        setVentas(data);
      }
    } catch {
      // silent
    }
  }, [loteId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ventas</h3>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Nueva Venta
        </Button>
      </div>

      {ventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay ventas registradas
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Comprador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((v) => {
              const cantidad = toNumber(v.cantidad);
              const precio = toNumber(v.precioUnitario);
              const total = cantidad * precio;
              return (
                <TableRow key={v.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(v.fecha).toLocaleDateString("es-CU")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {cantidad.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(precio, v.moneda as "USD" | "CUP")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(total, v.moneda as "USD" | "CUP")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.moneda}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.persona?.nombre ?? "\u2014"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <VentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        loteId={loteId}
        productos={productos}
        onSuccess={refreshVentas}
      />
    </div>
  );
}
