"use client";

import { useEffect, useState } from "react";
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
import { gastoSchema, type GastoFormData } from "@/lib/validations";

interface Lote {
  id: string;
  nombre: string;
}

const categorias: { value: string; label: string }[] = [
  { value: "SERVICIOS", label: "Servicios" },
  { value: "SALARIOS", label: "Salarios" },
  { value: "LOGISTICA", label: "Logistica" },
  { value: "IMPREVISTOS", label: "Imprevistos" },
  { value: "OTROS", label: "Otros" },
];

interface GastoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  gasto?: GastoFormData;
  onSubmit: (data: GastoFormData) => void;
}

export function GastoModal({
  open,
  onOpenChange,
  title,
  gasto,
  onSubmit,
}: GastoModalProps) {
  const [lotes, setLotes] = useState<Lote[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      monto: 0,
      moneda: "CUP",
      categoria: "OTROS",
      descripcion: "",
      loteId: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetch("/api/lotes")
        .then((r) => r.ok && r.json())
        .then((data) => data && setLotes(Array.isArray(data) ? data : []))
        .catch(() => {});
      reset(
        gasto ?? {
          monto: 0,
          moneda: "CUP",
          categoria: "OTROS",
          descripcion: "",
          loteId: "",
        }
      );
    }
  }, [open, gasto, reset]);

  const onFormSubmit = (data: GastoFormData) => {
    onSubmit({
      ...data,
      monto: Number(data.monto) || 0,
    });
    onOpenChange(false);
  };

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
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              {...register("monto")}
              placeholder="0.00"
            />
            {errors.monto && (
              <p className="text-sm text-destructive">{errors.monto.message}</p>
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
              <p className="text-sm text-destructive">{errors.moneda.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Controller
              name="categoria"
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
                    {categorias.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria && (
              <p className="text-sm text-destructive">{errors.categoria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Input
              id="descripcion"
              {...register("descripcion")}
              placeholder="Descripcion (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loteId">Lote (opcional)</Label>
            <Controller
              name="loteId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar lote..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin lote</SelectItem>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nombre}
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
              Guardar
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
