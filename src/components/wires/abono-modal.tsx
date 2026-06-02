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
import { abonoWireSchema, type AbonoWireFormData } from "@/lib/validations";

interface AbonoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AbonoWireFormData) => void;
}

const monedas: { value: "CUP" | "USD"; label: string }[] = [
  { value: "CUP", label: "CUP" },
  { value: "USD", label: "USD" },
];

export function AbonoModal({
  open,
  onOpenChange,
  onSubmit,
}: AbonoModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AbonoWireFormData>({
    resolver: zodResolver(abonoWireSchema) as never,
    defaultValues: {
      monto: 0,
      moneda: "CUP",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        monto: 0,
        moneda: "CUP",
      });
    }
  }, [open, reset]);

  const onFormSubmit = async (data: AbonoWireFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nuevo Abono</DialogTitle>
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
              type="number"
              step="0.01"
              min="0.01"
              {...register("monto", { valueAsNumber: true })}
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
              <p className="text-sm text-destructive">
                {errors.moneda.message}
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
              Registrar Abono
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
