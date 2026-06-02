"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
import { CuentaModal } from "./cuenta-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import { canEdit, isAdmin } from "@/lib/role-utils";
import type { UserRole } from "@/types";
import type { CuentaBancariaFormData } from "@/lib/validations";

interface Cuenta {
  id: string;
  nombre: string;
  tipo: string;
  moneda: string;
  saldoActual: number | { $numberDecimal?: string } | string;
}

function toNumber(val: number | { $numberDecimal?: string } | string): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (val && typeof val === "object" && val.$numberDecimal) return Number(val.$numberDecimal);
  return 0;
}

function cuentaToFormData(c: Cuenta): CuentaBancariaFormData {
  return {
    nombre: c.nombre,
    tipo: c.tipo as "ZELLE" | "EFECTIVO" | "BANCO",
    moneda: c.moneda as "USD" | "CUP",
    saldoActual: toNumber(c.saldoActual),
  };
}

type CuentaTableProps = {
  cuentas: Cuenta[];
  userRole: UserRole;
};

const tipoLabels: Record<string, string> = {
  ZELLE: "Zelle",
  EFECTIVO: "Efectivo",
  BANCO: "Banco",
};

const monedaLabels: Record<string, string> = {
  USD: "USD",
  CUP: "CUP",
};

export function CuentaTable({ cuentas: initialCuentas, userRole }: CuentaTableProps) {
  const { data: session } = useSession();
  const role = userRole ?? (session?.user?.role as UserRole | undefined);

  const [cuentas, setCuentas] = useState<Cuenta[]>(initialCuentas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cuenta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cuenta | null>(null);

  const fetchCuentas = useCallback(async () => {
    try {
      const res = await fetch("/api/cuentas-bancarias");
      if (!res.ok) return;
      const data = await res.json();
      setCuentas(data);
    } catch {
      toast.error("Error al cargar cuentas bancarias");
    }
  }, []);

  const totalUsd = cuentas
    .filter((c) => c.moneda === "USD")
    .reduce((sum, c) => sum + toNumber(c.saldoActual), 0);

  const totalCup = cuentas
    .filter((c) => c.moneda === "CUP")
    .reduce((sum, c) => sum + toNumber(c.saldoActual), 0);

  const handleCreate = async (data: CuentaBancariaFormData) => {
    try {
      const res = await fetch("/api/cuentas-bancarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear cuenta");
        return;
      }
      toast.success("Cuenta creada");
      fetchCuentas();
    } catch {
      toast.error("Error al crear cuenta");
    }
  };

  const handleUpdate = async (data: CuentaBancariaFormData) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/cuentas-bancarias/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
        return;
      }
      toast.success("Cuenta actualizada");
      setEditing(null);
      fetchCuentas();
    } catch {
      toast.error("Error al actualizar cuenta");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/cuentas-bancarias/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar cuenta");
        return;
      }
      toast.success("Cuenta eliminada");
      setDeleteTarget(null);
      fetchCuentas();
    } catch {
      toast.error("Error al eliminar cuenta");
    }
  };

  const userCanEdit = role ? canEdit(role) : false;
  const userIsAdmin = role ? isAdmin(role) : false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total USD</p>
          <p className="text-2xl font-bold font-mono text-green-600">
            {formatCurrency(totalUsd, "USD")}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total CUP</p>
          <p className="text-2xl font-bold font-mono text-secondary-foreground">
            {formatCurrency(totalCup, "CUP")}
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex-1" />
        {userCanEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva Cuenta
          </Button>
        )}
      </div>

      {cuentas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay cuentas bancarias registradas
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {cuentas.map((c) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tipoLabels[c.tipo]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.moneda === "USD" ? "default" : "secondary"}
                      className={c.moneda === "USD" ? "bg-green-600 hover:bg-green-600/80" : ""}
                    >
                      {monedaLabels[c.moneda]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(toNumber(c.saldoActual), c.moneda as "USD" | "CUP")}
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
                              setEditing(c);
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
                              onClick={() => setDeleteTarget(c)}
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

      <CuentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar Cuenta" : "Nueva Cuenta"}
        cuenta={editing ? cuentaToFormData(editing) : undefined}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar Cuenta"
        description={`Esta seguro que desea eliminar "${deleteTarget?.nombre}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
