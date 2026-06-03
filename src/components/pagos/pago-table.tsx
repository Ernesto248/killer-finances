"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { FAB } from "@/components/shared/fab";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PagoModal } from "./pago-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { canEdit, isAdmin } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { PagoFormData } from "@/lib/validations";

interface Pago {
  id: string;
  personaId: string;
  fecha: string;
  monto: number | { $numberDecimal?: string } | string;
  moneda: string;
  descripcion: string | null;
  persona: {
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

function pagoToFormData(p: Pago): PagoFormData {
  return {
    personaId: p.personaId,
    monto: toNumber(p.monto),
    moneda: p.moneda as "USD" | "CUP",
    descripcion: p.descripcion ?? "",
  };
}

function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PagoTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pago | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pago | null>(null);

  const fetchPagos = useCallback(async () => {
    try {
      const res = await fetch("/api/pagos");
      if (!res.ok) return;
      const data = await res.json();
      setPagos(data);
    } catch {
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  const handleCreate = async (data: PagoFormData) => {
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear pago");
        return;
      }
      toast.success("Pago registrado");
      fetchPagos();
    } catch {
      toast.error("Error al crear pago");
    }
  };

  const handleUpdate = async (data: PagoFormData) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/pagos/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
        return;
      }
      toast.success("Pago actualizado");
      setEditing(null);
      fetchPagos();
    } catch {
      toast.error("Error al actualizar pago");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/pagos/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar pago");
        return;
      }
      toast.success("Pago eliminado");
      setDeleteTarget(null);
      fetchPagos();
    } catch {
      toast.error("Error al eliminar pago");
    }
  };

  const userCanEdit = role ? canEdit(role) : false;
  const userIsAdmin = role ? isAdmin(role) : false;

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
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo Pago
          </Button>
        )}
      </div>

      {/* MOBILE: Card view */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {pagos.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">
              No hay pagos registrados
            </div>
          ) : (
            pagos.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ExpandableCard
                  header={
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{p.persona.nombre}</p>
                        <p className="text-xs text-[#6b7280]">{formatFecha(p.fecha)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <p className="text-sm font-mono text-[#dc2626]">
                          {formatCurrency(toNumber(p.monto), p.moneda as "USD" | "CUP")}
                        </p>
                        <Badge variant="outline" className="text-xs">{p.moneda}</Badge>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-3 pt-3">
                    {p.descripcion && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">Descripcion</span>
                        <span className="text-sm">{p.descripcion}</span>
                      </div>
                    )}
                    {(userCanEdit || userIsAdmin) && (
                      <div className="flex items-center gap-2">
                        {userCanEdit && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(p);
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                        {userIsAdmin && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(p);
                            }}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {userCanEdit && (
          <FAB
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            label="Nuevo"
          />
        )}
      </div>

      {/* DESKTOP: Table view */}
      <div className="hidden md:block">
        {pagos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hay pagos registrados
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {pagos.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {formatFecha(p.fecha)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <a
                        href={`/personas/${p.persona.id}`}
                        className="hover:underline"
                      >
                        {p.persona.nombre}
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {formatCurrency(toNumber(p.monto), p.moneda as "USD" | "CUP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.moneda}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {p.descripcion || "\u2014"}
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
                                setEditing(p);
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
                                onClick={() => setDeleteTarget(p)}
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
      </div>

      <PagoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar Pago" : "Nuevo Pago"}
        pago={editing ? pagoToFormData(editing) : undefined}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar Pago"
        description={`Esta seguro que desea eliminar este pago? Esta accion revertira el balance de la persona.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
