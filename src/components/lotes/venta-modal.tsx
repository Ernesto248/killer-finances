"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
import { loteVentaSchema, type LoteVentaFormData } from "@/lib/validations";

interface Producto {
  id: string;
  nombre: string;
  cantidadTotal: number | { $numberDecimal?: string } | string;
  cantidadVendida: number | { $numberDecimal?: string } | string;
  costoUnitario: number | { $numberDecimal?: string } | string;
}

interface VentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteId: string;
  productos: Producto[];
  onSuccess?: () => void;
}

export function VentaModal({
  open,
  onOpenChange,
  loteId,
  onSuccess,
}: VentaModalProps) {
  const [personas, setPersonas] = useState<{ id: string; nombre: string }[]>(
    []
  );

  useEffect(() => {
    fetch("/api/personas")
      .then((res) => res.json())
      .then(setPersonas)
      .catch(() => {});
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoteVentaFormData>({
    resolver: zodResolver(loteVentaSchema) as never,
    defaultValues: {
      cantidad: 0,
      precioUnitario: 0,
      moneda: "CUP",
      personaId: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        cantidad: 0,
        precioUnitario: 0,
        moneda: "CUP",
        personaId: null,
      });
    }
  }, [open, reset]);

  const onFormSubmit = async (data: LoteVentaFormData) => {
    try {
      const res = await fetch(`/api/lotes/${loteId}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          cantidad: Number(data.cantidad) || 0,
          precioUnitario: Number(data.precioUnitario) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al registrar venta");
        return;
      }
      toast.success("Venta registrada");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Error al registrar venta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              {...register("cantidad")}
            />
            {errors.cantidad && (
              <p className="text-sm text-destructive">
                {errors.cantidad.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precioUnitario">Precio Unitario</Label>
            <Input
              id="precioUnitario"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              {...register("precioUnitario")}
            />
            {errors.precioUnitario && (
              <p className="text-sm text-destructive">
                {errors.precioUnitario.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Controller
              name="moneda"
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
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CUP">CUP</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.moneda && (
              <p className="text-sm text-destructive">
                {errors.moneda.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="personaId">Comprador (opcional)</Label>
            <Controller
              name="personaId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar comprador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin comprador</SelectItem>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Registrar
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
