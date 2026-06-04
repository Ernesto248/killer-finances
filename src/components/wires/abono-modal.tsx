"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { abonoWireSchema, type AbonoWireFormData } from "@/lib/validations";
import { formatInputNumber } from "@/lib/utils";

interface AbonoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AbonoWireFormData) => void;
}

const monedas: { value: "CUP" | "USD"; label: string }[] = [
  { value: "CUP", label: "CUP" },
  { value: "USD", label: "USD" },
];

export function AbonoModal({ open, onOpenChange, onSubmit }: AbonoModalProps) {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AbonoWireFormData>({
    resolver: zodResolver(abonoWireSchema),
    defaultValues: { monto: 0, moneda: "CUP" },
  });

  useEffect(() => {
    if (open) reset({ monto: 0, moneda: "CUP" });
  }, [open, reset]);

  const onFormSubmit = async (data: AbonoWireFormData) => {
    await onSubmit({ ...data, monto: Number(data.monto) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
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
            <Controller
              name="monto"
              control={control}
              render={({ field }) => (
                <Input
                  id="monto"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={field.value ? formatInputNumber(field.value) : ""}
                  onChange={(e) => field.onChange(e.target.value.replace(/,/g, ""))}
                />
              )}
            />
            {errors.monto && <p className="text-sm text-destructive">{errors.monto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Controller
              name="moneda"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monedas.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.moneda && <p className="text-sm text-destructive">{errors.moneda.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Registrar Pago</Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
