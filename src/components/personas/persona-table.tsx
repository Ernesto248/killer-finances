"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

import { toast } from "sonner";
import { ExpandableCard } from "@/components/shared/expandable-card";
import { FAB } from "@/components/shared/fab";
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
import { PersonaModal } from "./persona-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { canEdit, isAdmin } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { PersonaFormData } from "@/lib/validations";

interface Persona {
  id: string;
  nombre: string;
  alias: string | null;
  tipo: string;
  activo: boolean;
  balanceUsd: number | { $numberDecimal?: string } | string;
  balanceCup: number | { $numberDecimal?: string } | string;
}

function toNumber(val: number | { $numberDecimal?: string } | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (val && typeof val === "object" && val.$numberDecimal) return Number(val.$numberDecimal);
  return 0;
}

function personaToFormData(p: Persona): PersonaFormData {
  return {
    nombre: p.nombre,
    telefono: (p as Persona & { telefono?: string }).telefono ?? "",
    alias: p.alias ?? "",
    tipo: p.tipo,
    activo: p.activo,
    balanceUsd: toNumber(p.balanceUsd),
    balanceCup: toNumber(p.balanceCup),
  };
}

export function PersonaTable() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Persona | null>(null);

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch("/api/personas");
      if (!res.ok) return;
      const data = await res.json();
      setPersonas(data);
    } catch {
      toast.error("Error al cargar personas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const filtered = personas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.alias && p.alias.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (data: PersonaFormData) => {
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear persona");
        return;
      }
      toast.success("Persona creada");
      fetchPersonas();
    } catch {
      toast.error("Error al crear persona");
    }
  };

  const handleUpdate = async (data: PersonaFormData) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/personas/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
        return;
      }
      toast.success("Persona actualizada");
      setEditing(null);
      fetchPersonas();
    } catch {
      toast.error("Error al actualizar persona");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/personas/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar persona");
        return;
      }
      toast.success("Persona eliminada");
      setDeleteTarget(null);
      fetchPersonas();
    } catch {
      toast.error("Error al eliminar persona");
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
            placeholder="Buscar por nombre o alias..."
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
            Nueva Persona
          </Button>
        )}
      </div>

      {/* MOBILE: Card view */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">
              {search
                ? "No se encontraron personas con ese criterio"
                : "No hay personas registradas"}
            </div>
          ) : (
            filtered.map((p) => {
              const usd = toNumber(p.balanceUsd);
              const cup = toNumber(p.balanceCup);
              return (
                <div key={p.id}>
                  <ExpandableCard
                    header={
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{p.nombre}</p>
                          <p className="text-xs text-[#6b7280]">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.tipo}</Badge>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right">
                            <p className={`text-xs font-mono ${usd >= 0 ? "text-[#059669]" : "text-[#dc2626]"}`}>
                              {formatCurrency(usd, "USD")}
                            </p>
                            <p className={`text-xs font-mono ${cup >= 0 ? "text-[#059669]" : "text-[#dc2626]"}`}>
                              {formatCurrency(cup, "CUP")}
                            </p>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3 pt-3">
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
                </div>
              );
            })
          )}
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {search
                ? "No se encontraron personas con ese criterio"
                : "No hay personas registradas"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Balance USD</TableHead>
                <TableHead className="text-right">Balance CUP</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.alias || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.tipo}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        toNumber(p.balanceUsd) >= 0
                          ? "text-[#30d158]"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(toNumber(p.balanceUsd), "USD")}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        toNumber(p.balanceCup) >= 0
                          ? "text-[#30d158]"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(toNumber(p.balanceCup), "CUP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.activo ? "default" : "secondary"}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </Badge>
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
                  </tr>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PersonaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar Persona" : "Nueva Persona"}
        persona={editing ? personaToFormData(editing) : undefined}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar Persona"
        description={`Esta seguro que desea eliminar a "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
