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
import { pagoSchema, type PagoFormData } from "@/lib/validations";

interface PersonaOption {
  id: string;
  nombre: string;
  alias: string | null;
}

interface PagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pago?: PagoFormData;
  onSubmit: (data: PagoFormData) => void;
}

const monedas: { value: "USD" | "CUP"; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "CUP", label: "CUP" },
];

export function PagoModal({
  open,
  onOpenChange,
  title,
  pago,
  onSubmit,
}: PagoModalProps) {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema) as never,
    defaultValues: {
      personaId: "",
      monto: 0,
      moneda: "CUP",
      descripcion: "",
    },
  });

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
        pago ?? {
          personaId: "",
          monto: 0,
          moneda: "CUP",
          descripcion: "",
        }
      );
    }
  }, [open, pago, reset, fetchPersonas]);

  const onFormSubmit = (data: PagoFormData) => {
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
            <Label htmlFor="personaId">Persona</Label>
            <Controller
              name="personaId"
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
                        {p.nombre}{p.alias ? ` (${p.alias})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.personaId && (
              <p className="text-sm text-destructive">
                {errors.personaId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              {...register("monto")}
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

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Input
              id="descripcion"
              {...register("descripcion")}
              placeholder="Descripcion del pago (opcional)"
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
