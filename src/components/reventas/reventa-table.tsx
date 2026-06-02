"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReventaModal } from "./reventa-modal";
import { formatCurrency } from "@/lib/utils";
import { canEdit } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { ReventaWireFormData } from "@/lib/validations";

interface Reventa {
  id: string;
  compradorId: string;
  vendedorId: string;
  fecha: string;
  montoUsd: number | { $numberDecimal?: string } | string;
  tasaCompra: number | { $numberDecimal?: string } | string;
  tasaVenta: number | { $numberDecimal?: string } | string;
  gananciaCup: number | { $numberDecimal?: string } | string;
  comprador: {
    id: string;
    nombre: string;
  };
  vendedor: {
    id: string;
    nombre: string;
  };
}

function toNumber(val: number | { $numberDecimal?: string } | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (val && typeof val === "object" && val.$numberDecimal)
    return Number(val.$numberDecimal);
  return 0;
}

function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReventaTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [reventas, setReventas] = useState<Reventa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReventas = useCallback(async () => {
    try {
      const res = await fetch("/api/reventas");
      if (!res.ok) return;
      const data = await res.json();
      setReventas(data);
    } catch {
      toast.error("Error al cargar reventas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReventas();
  }, [fetchReventas]);

  const handleCreate = async (data: ReventaWireFormData) => {
    try {
      const res = await fetch("/api/reventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear reventa");
        return;
      }
      toast.success("Reventa creada");
      fetchReventas();
    } catch {
      toast.error("Error al crear reventa");
    }
  };

  const userCanEdit = role ? canEdit(role) : false;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {userCanEdit && (
          <Button
            onClick={() => {
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva Reventa
          </Button>
        )}
      </div>

      {reventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay reventas registradas
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead className="text-right">Tasa C</TableHead>
              <TableHead className="text-right">Tasa V</TableHead>
              <TableHead className="text-right">Spread</TableHead>
              <TableHead className="text-right">Ganancia CUP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {reventas.map((r) => {
                const tasaC = toNumber(r.tasaCompra);
                const tasaV = toNumber(r.tasaVenta);
                const spread = tasaC - tasaV;
                return (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {formatFecha(r.fecha)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <a
                        href={`/personas/${r.comprador.id}`}
                        className="hover:underline"
                      >
                        {r.comprador.nombre}
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">
                      <a
                        href={`/personas/${r.vendedor.id}`}
                        className="hover:underline"
                      >
                        {r.vendedor.nombre}
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(toNumber(r.montoUsd), "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tasaC.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tasaV.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {spread.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        toNumber(r.gananciaCup) >= 0
                          ? "text-green-600"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(toNumber(r.gananciaCup), "CUP")}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      )}

      <ReventaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nueva Reventa"
        onSubmit={handleCreate}
      />
    </div>
  );
}
