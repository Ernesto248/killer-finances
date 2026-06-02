"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
import { CuadreModal } from "./cuadre-modal";
import { formatCurrency } from "@/lib/utils";
import { canEdit } from "@/lib/role-utils";
import type { UserRole } from "@/types";

interface CuadreRow {
  id: string;
  fecha: string;
  deudaFinalCup: number | { $numberDecimal?: string } | string;
  totalZelleUsd: number | { $numberDecimal?: string } | string;
  tasaPromedioCup: number | { $numberDecimal?: string } | string;
  persona: {
    id: string;
    nombre: string;
  };
}

function num(d: unknown): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (d && typeof d === "object" && "$numberDecimal" in d) {
    return Number((d as { $numberDecimal: string }).$numberDecimal);
  }
  return 0;
}

export function CuadreTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [cuadres, setCuadres] = useState<CuadreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCuadres = useCallback(async () => {
    try {
      const res = await fetch("/api/cuadres");
      if (!res.ok) return;
      const data = await res.json();
      setCuadres(data);
    } catch {
      toast.error("Error al cargar cuadres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCuadres();
  }, [fetchCuadres]);

  const userCanEdit = role ? canEdit(role) : false;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1" />
        {userCanEdit && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Nuevo Cuadre
          </Button>
        )}
      </div>

      {cuadres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay cuadres registrados
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead className="text-right">USD Zelle</TableHead>
              <TableHead className="text-right">Tasa Prom.</TableHead>
              <TableHead className="text-right">Deuda Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {cuadres.map((c) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <Link
                      href={`/cuadres/${c.id}`}
                      className="text-foreground hover:underline"
                    >
                      {new Date(c.fecha).toLocaleDateString("es-CU")}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/personas/${c.persona.id}`}
                      className="text-foreground hover:underline"
                    >
                      {c.persona.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(num(c.totalZelleUsd), "USD")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {num(c.tasaPromedioCup).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(num(c.deudaFinalCup), "CUP")}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      )}

      <CuadreModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={fetchCuadres}
      />
    </div>
  );
}
