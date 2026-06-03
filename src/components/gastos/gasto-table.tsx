"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
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
import { GastoModal } from "./gasto-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { canEdit, isAdmin } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { GastoFormData } from "@/lib/validations";

type CategoriaGasto = "SERVICIOS" | "SALARIOS" | "LOGISTICA" | "IMPREVISTOS" | "OTROS";

const categoriaBadgeVariant: Record<CategoriaGasto, "default" | "secondary" | "outline" | "destructive"> = {
  SERVICIOS: "default",
  SALARIOS: "secondary",
  LOGISTICA: "outline",
  IMPREVISTOS: "destructive",
  OTROS: "default",
};

interface Gasto {
  id: string;
  fecha: string;
  monto: number;
  moneda: string;
  categoria: string;
  descripcion: string | null;
  loteId: string | null;
  lote: { id: string; nombre: string } | null;
}

function gastoToFormData(g: Gasto): GastoFormData {
  return {
    monto: g.monto,
    moneda: g.moneda as "USD" | "CUP",
    categoria: g.categoria as GastoFormData["categoria"],
    descripcion: g.descripcion ?? "",
    loteId: g.loteId ?? "",
  };
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GastoTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);

  const fetchGastos = useCallback(async () => {
    try {
      const res = await fetch("/api/gastos");
      if (!res.ok) return;
      const data = await res.json();
      setGastos(data);
    } catch {
      toast.error("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  const filtered = gastos.filter(
    (g) =>
      (g.descripcion && g.descripcion.toLowerCase().includes(search.toLowerCase())) ||
      g.categoria.toLowerCase().includes(search.toLowerCase()) ||
      (g.lote?.nombre && g.lote.nombre.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (data: GastoFormData) => {
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          loteId: data.loteId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear gasto");
        return;
      }
      toast.success("Gasto creado");
      fetchGastos();
    } catch {
      toast.error("Error al crear gasto");
    }
  };

  const handleUpdate = async (data: GastoFormData) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/gastos/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          loteId: data.loteId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
        return;
      }
      toast.success("Gasto actualizado");
      setEditing(null);
      fetchGastos();
    } catch {
      toast.error("Error al actualizar gasto");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/gastos/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar gasto");
        return;
      }
      toast.success("Gasto eliminado");
      setDeleteTarget(null);
      fetchGastos();
    } catch {
      toast.error("Error al eliminar gasto");
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
            placeholder="Buscar por descripcion, categoria o lote..."
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
            Nuevo Gasto
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search
              ? "No se encontraron gastos con ese criterio"
              : "No hay gastos registrados"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((g) => (
                <motion.tr
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>{formatFecha(g.fecha)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatCurrency(g.monto, g.moneda as "USD" | "CUP")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{g.moneda}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        categoriaBadgeVariant[g.categoria as CategoriaGasto] ?? "default"
                      }
                    >
                      {g.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {g.descripcion || "\u2014"}
                  </TableCell>
                  <TableCell>
                    {g.lote ? (
                      <Link
                        href={`/lotes/${g.lote.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {g.lote.nombre}
                        <ExternalLink className="size-3" />
                      </Link>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 w-8">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {userCanEdit && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(g);
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
                              onClick={() => setDeleteTarget(g)}
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

      <GastoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar Gasto" : "Nuevo Gasto"}
        gasto={editing ? gastoToFormData(editing) : undefined}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar Gasto"
        description={`Esta seguro que desea eliminar este gasto? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
