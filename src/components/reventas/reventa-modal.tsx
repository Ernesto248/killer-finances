"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { reventaWireSchema, type ReventaWireFormData } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

interface PersonaOption {
  id: string;
  nombre: string;
  alias: string | null;
  tipo: string;
}

interface ReventaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  reventa?: ReventaWireFormData;
  onSubmit: (data: ReventaWireFormData) => void;
}

export function ReventaModal({
  open,
  onOpenChange,
  title,
  reventa,
  onSubmit,
}: ReventaModalProps) {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReventaWireFormData>({
    resolver: zodResolver(reventaWireSchema) as never,
    defaultValues: {
      compradorId: "",
      vendedorId: "",
      montoUsd: 0,
      tasaCompra: 0,
      tasaVenta: 0,
    },
  });

  const montoUsd = watch("montoUsd");
  const tasaCompra = watch("tasaCompra");
  const tasaVenta = watch("tasaVenta");

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch("/api/personas");
      if (!res.ok) return;
      const data = await res.json();
      setPersonas(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPersonas();
      reset(
        reventa ?? {
          compradorId: "",
          vendedorId: "",
          montoUsd: 0,
          tasaCompra: 0,
          tasaVenta: 0,
        }
      );
    }
  }, [open, reventa, reset, fetchPersonas]);

  const onFormSubmit = (data: ReventaWireFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const estimatedSpread = tasaCompra - tasaVenta;
  const estimatedGanancia =
    montoUsd && tasaCompra && tasaVenta
      ? Math.round(montoUsd * estimatedSpread)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="compradorId">Comprador</Label>
            <Controller
              name="compradorId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                        {p.alias ? ` (${p.alias})` : ""}
                        {" - "}
                        {p.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.compradorId && (
              <p className="text-sm text-destructive">
                {errors.compradorId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendedorId">Vendedor</Label>
            <Controller
              name="vendedorId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                        {p.alias ? ` (${p.alias})` : ""}
                        {" - "}
                        {p.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vendedorId && (
              <p className="text-sm text-destructive">
                {errors.vendedorId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoUsd">Monto USD</Label>
            <Input
              id="montoUsd"
              type="number"
              step="0.01"
              min="0.01"
              {...register("montoUsd", { valueAsNumber: true })}
            />
            {errors.montoUsd && (
              <p className="text-sm text-destructive">
                {errors.montoUsd.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tasaCompra">Tasa de Compra</Label>
              <Input
                id="tasaCompra"
                type="number"
                step="0.01"
                min="0.01"
                {...register("tasaCompra", { valueAsNumber: true })}
              />
              {errors.tasaCompra && (
                <p className="text-sm text-destructive">
                  {errors.tasaCompra.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasaVenta">Tasa de Venta</Label>
              <Input
                id="tasaVenta"
                type="number"
                step="0.01"
                min="0.01"
                {...register("tasaVenta", { valueAsNumber: true })}
              />
              {errors.tasaVenta && (
                <p className="text-sm text-destructive">
                  {errors.tasaVenta.message}
                </p>
              )}
            </div>
          </div>

          {(estimatedGanancia > 0 || estimatedGanancia < 0) && (
            <Card>
              <CardContent className="p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spread</span>
                  <span className="font-mono font-bold">
                    {estimatedSpread.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Ganancia CUP est.
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      estimatedGanancia >= 0
                        ? "text-[#30d158]"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(Math.abs(estimatedGanancia), "CUP")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Guardar
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
