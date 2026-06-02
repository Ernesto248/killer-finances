"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoteModal } from "./lote-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { canEdit, isAdmin } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { LoteFormData } from "@/lib/validations";

interface Lote {
  id: string;
  nombre: string;
  fechaCompra: string;
  costoTotal: number | { $numberDecimal?: string } | string;
  monedaCosto: string;
  productos: LoteProducto[];
  ventas: LoteVentaItem[];
}

interface LoteProducto {
  id: string;
  nombre: string;
  cantidadTotal: number | { $numberDecimal?: string } | string;
  cantidadVendida: number | { $numberDecimal?: string } | string;
  costoUnitario: number | { $numberDecimal?: string } | string;
}

interface LoteVentaItem {
  id: string;
  cantidad: number | { $numberDecimal?: string } | string;
  precioUnitario: number | { $numberDecimal?: string } | string;
}

function toNumber(val: number | { $numberDecimal?: string } | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (val && typeof val === "object" && val.$numberDecimal)
    return Number(val.$numberDecimal);
  return 0;
}

function loteToFormData(lote: Lote): LoteFormData {
  return {
    nombre: lote.nombre,
    costoTotal: toNumber(lote.costoTotal),
    monedaCosto: lote.monedaCosto as "USD" | "CUP",
    productos: lote.productos.map((p) => ({
      nombre: p.nombre,
      cantidadTotal: toNumber(p.cantidadTotal),
      costoUnitario: toNumber(p.costoUnitario),
    })),
  };
}

export function LoteTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lote | null>(null);

  const fetchLotes = useCallback(async () => {
    try {
      const res = await fetch("/api/lotes");
      if (!res.ok) return;
      const data = await res.json();
      setLotes(data);
    } catch {
      toast.error("Error al cargar lotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLotes();
  }, [fetchLotes]);

  const filtered = lotes.filter((l) =>
    l.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: LoteFormData) => {
    try {
      const res = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear lote");
        return;
      }
      toast.success("Lote creado");
      fetchLotes();
    } catch {
      toast.error("Error al crear lote");
    }
  };

  const handleUpdate = async (data: LoteFormData) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/lotes/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
        return;
      }
      toast.success("Lote actualizado");
      setEditing(null);
      fetchLotes();
    } catch {
      toast.error("Error al actualizar lote");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/lotes/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar lote");
        return;
      }
      toast.success("Lote eliminado");
      setDeleteTarget(null);
      fetchLotes();
    } catch {
      toast.error("Error al eliminar lote");
    }
  };

  const userCanEdit = role ? canEdit(role) : false;
  const userIsAdmin = role ? isAdmin(role) : false;

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
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {userCanEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo Lote
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "No se encontraron lotes con ese criterio"
              : "No hay lotes registrados"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha Compra</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((l) => (
                <motion.tr
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/lotes/${l.id}`}
                      className="hover:underline"
                    >
                      {l.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(l.fechaCompra).toLocaleDateString("es-CU")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(
                      toNumber(l.costoTotal),
                      l.monedaCosto as "USD" | "CUP"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.monedaCosto}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {l.productos.length} productos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {userCanEdit && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(l);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {userIsAdmin && (
                          <>
                            {userCanEdit && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(l)}
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      )}

      <LoteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar Lote" : "Nuevo Lote"}
        defaultValues={editing ? loteToFormData(editing) : undefined}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar Lote"
        description={`Esta seguro que desea eliminar "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
