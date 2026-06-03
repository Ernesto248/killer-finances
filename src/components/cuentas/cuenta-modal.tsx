"use client";

import { useEffect } from "react";
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
import {
  cuentaBancariaSchema,
  type CuentaBancariaFormData,
} from "@/lib/validations";
import type { CuentaTipo, Moneda } from "@/types";

interface CuentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  cuenta?: CuentaBancariaFormData;
  onSubmit: (data: CuentaBancariaFormData) => void;
}

const tipos: { value: CuentaTipo; label: string }[] = [
  { value: "ZELLE", label: "Zelle" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "BANCO", label: "Banco" },
];

const monedas: { value: Moneda; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "CUP", label: "CUP" },
];

export function CuentaModal({
  open,
  onOpenChange,
  title,
  cuenta,
  onSubmit,
}: CuentaModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CuentaBancariaFormData>({
    resolver: zodResolver(cuentaBancariaSchema) as never,
    defaultValues: {
      nombre: "",
      tipo: "ZELLE",
      moneda: "USD",
      saldoActual: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        cuenta ?? {
          nombre: "",
          tipo: "ZELLE",
          moneda: "USD",
          saldoActual: 0,
        }
      );
    }
  }, [open, cuenta, reset]);

  const onFormSubmit = (data: CuentaBancariaFormData) => {
    onSubmit({
      ...data,
      saldoActual: Number(data.saldoActual) || 0,
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
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Nombre de la cuenta"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Controller
                name="tipo"
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
                      {tipos.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
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
                      {monedas.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.moneda && (
                <p className="text-sm text-destructive">{errors.moneda.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldoActual">Saldo Actual</Label>
            <Input
              id="saldoActual"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              {...register("saldoActual")}
              placeholder="0.00"
            />
            {errors.saldoActual && (
              <p className="text-sm text-destructive">
                {errors.saldoActual.message}
              </p>
            )}
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
