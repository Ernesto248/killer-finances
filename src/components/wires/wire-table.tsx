"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { toast } from "sonner";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { FAB } from "@/components/shared/fab";
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
import { Badge } from "@/components/ui/badge";
import { WireModal } from "./wire-modal";
import { formatCurrency } from "@/lib/utils";
import { canEdit } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { WireFormData } from "@/lib/validations";

interface Wire {
  id: string;
  compradorId: string;
  fecha: string;
  montoUsd: number | { $numberDecimal?: string } | string;
  tasaPactada: number | { $numberDecimal?: string } | string;
  montoCupTotal: number | { $numberDecimal?: string } | string;
  montoPagadoCup: number | { $numberDecimal?: string } | string;
  gananciaCup: number | { $numberDecimal?: string } | string;
  estado: string;
  comprador: {
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

function estadoBadge(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return <Badge variant="outline">{estado}</Badge>;
    case "PARCIAL":
      return <Badge variant="secondary">{estado}</Badge>;
    case "PAGADO":
      return <Badge variant="default">{estado}</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

export function WireTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [wires, setWires] = useState<Wire[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchWires = useCallback(async () => {
    try {
      const res = await fetch("/api/wires");
      if (!res.ok) return;
      const data = await res.json();
      setWires(data);
    } catch {
      toast.error("Error al cargar wires");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWires();
  }, [fetchWires]);

  const handleCreate = async (data: WireFormData) => {
    try {
      const res = await fetch("/api/wires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear wire");
        return;
      }
      toast.success("Wire creado");
      fetchWires();
    } catch {
      toast.error("Error al crear wire");
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
            Nuevo Wire
          </Button>
        )}
      </div>

      {/* MOBILE: Card view */}
      <div className="md:hidden space-y-3">
        {wires.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">
              No hay wires registrados
            </div>
          ) : (
            wires.map((w) => {
              const total = toNumber(w.montoCupTotal);
              const pagado = toNumber(w.montoPagadoCup);
              const pendiente = total - pagado;
              return (
                <div key={w.id}>
                  <ExpandableCard
                    header={
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{w.comprador.nombre}</p>
                          <p className="text-xs text-[#6b7280]">{formatFecha(w.fecha)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <p className="text-sm font-mono">{formatCurrency(toNumber(w.montoUsd), "USD")}</p>
                          {estadoBadge(w.estado)}
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">Tasa</span>
                        <span className="text-sm font-mono">{toNumber(w.tasaPactada).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">Total CUP</span>
                        <span className="text-sm font-mono">{formatCurrency(total, "CUP")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">Pagado</span>
                        <span className="text-sm font-mono text-[#059669]">{formatCurrency(pagado, "CUP")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">Pendiente</span>
                        <span className="text-sm font-mono text-[#dc2626]">{formatCurrency(Math.max(0, pendiente), "CUP")}</span>
                      </div>
                      <Link
                        href={`/wires/${w.id}`}
                        className="block text-center text-sm text-[#2563eb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </ExpandableCard>
                </div>
              );
            })
          )}
        {userCanEdit && (
          <FAB
            onClick={() => setModalOpen(true)}
            label="Nuevo"
          />
        )}
      </div>

      {/* DESKTOP: Table view */}
      <div className="hidden md:block">
        {wires.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hay wires registrados
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">Tasa</TableHead>
                <TableHead className="text-right">Total CUP</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {wires.map((w) => {
                  const total = toNumber(w.montoCupTotal);
                  const pagado = toNumber(w.montoPagadoCup);
                  const pendiente = total - pagado;
                  return (
                    <tr
                      key={w.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        window.location.href = `/wires/${w.id}`;
                      }}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {formatFecha(w.fecha)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <a
                          href={`/personas/${w.comprador.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {w.comprador.nombre}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(toNumber(w.montoUsd), "USD")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {toNumber(w.tasaPactada).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(total, "CUP")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[#30d158]">
                        {formatCurrency(pagado, "CUP")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {formatCurrency(Math.max(0, pendiente), "CUP")}
                      </TableCell>
                      <TableCell>{estadoBadge(w.estado)}</TableCell>
                    </tr>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </div>

      <WireModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nuevo Wire"
        onSubmit={handleCreate}
      />
    </div>
  );
}
