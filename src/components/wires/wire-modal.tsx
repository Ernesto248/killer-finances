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
import { wireSchema, type WireFormData } from "@/lib/validations";
import { formatCurrency, formatInputNumber } from "@/lib/utils";

interface PersonaOption {
  id: string;
  nombre: string;
  alias: string | null;
  tipo: string;
}

interface WireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  wire?: WireFormData;
  onSubmit: (data: WireFormData) => void;
}

const monedas: { value: "CUP" | "USD"; label: string }[] = [
  { value: "CUP", label: "CUP" },
  { value: "USD", label: "USD" },
];

export function WireModal({
  open,
  onOpenChange,
  title,
  wire,
  onSubmit,
}: WireModalProps) {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [tasaPromedioRemeseros, setTasaPromedioRemeseros] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WireFormData>({
    resolver: zodResolver(wireSchema),
    defaultValues: {
      compradorId: "",
      montoUsd: 0,
      tasaPactada: 0,
      monedaPago: "CUP",
      porcentajeComision: null,
    },
  });

  const montoUsd = watch("montoUsd");
  const tasaPactada = watch("tasaPactada");

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

  const fetchTasaPromedio = useCallback(async () => {
    try {
      const res = await fetch("/api/cuadres");
      if (!res.ok) return;
      const cuadres = await res.json();
      if (!cuadres.length) return;
      const avg =
        cuadres.reduce(
          (acc: number, c: { tasaPromedioCup: unknown }) => {
            const val =
              typeof c.tasaPromedioCup === "number"
                ? c.tasaPromedioCup
                : Number((c.tasaPromedioCup as { $numberDecimal?: string })?.$numberDecimal ?? 0);
            return acc + val;
          },
          0
        ) / cuadres.length;
      setTasaPromedioRemeseros(avg);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPersonas();
      fetchTasaPromedio();
      reset(
        wire ?? {
          compradorId: "",
          montoUsd: 0,
          tasaPactada: 0,
          monedaPago: "CUP",
          porcentajeComision: null,
        }
      );
    }
  }, [open, wire, reset, fetchPersonas, fetchTasaPromedio]);

  const onFormSubmit = (data: WireFormData) => {
    onSubmit({
      ...data,
      montoUsd: Number(data.montoUsd) || 0,
      tasaPactada: Number(data.tasaPactada) || 0,
      porcentajeComision: data.porcentajeComision != null ? Number(data.porcentajeComision) || null : null,
    });
    onOpenChange(false);
  };

  const estimatedTotalCup =
    montoUsd && tasaPactada ? Math.round(montoUsd * tasaPactada) : 0;
  const estimatedGanancia =
    montoUsd && tasaPactada
      ? Math.round(montoUsd * (tasaPactada - tasaPromedioRemeseros))
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montoUsd">Monto USD</Label>
              <Controller
                name="montoUsd"
                control={control}
                render={({ field }) => (
                  <Input
                    id="montoUsd"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={field.value ? formatInputNumber(field.value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      field.onChange(raw);
                    }}
                  />
                )}
              />
              {errors.montoUsd && (
                <p className="text-sm text-destructive">
                  {errors.montoUsd.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasaPactada">Tasa Pactada</Label>
              <Controller
                name="tasaPactada"
                control={control}
                render={({ field }) => (
                  <Input
                    id="tasaPactada"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={field.value ? formatInputNumber(field.value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      field.onChange(raw);
                    }}
                  />
                )}
              />
              {errors.tasaPactada && (
                <p className="text-sm text-destructive">
                  {errors.tasaPactada.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monedaPago">Moneda de Pago</Label>
            <Controller
              name="monedaPago"
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
            {errors.monedaPago && (
              <p className="text-sm text-destructive">
                {errors.monedaPago.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="porcentajeComision">% Comision (opcional)</Label>
            <Input
              id="porcentajeComision"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              {...register("porcentajeComision")}
              placeholder="Porcentaje de comision"
            />
          </div>

          {(estimatedTotalCup > 0 || estimatedGanancia !== 0) && (
            <Card>
              <CardContent className="p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total CUP est.</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(estimatedTotalCup, "CUP")}
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tasa prom. remeseros
                  </span>
                  <span className="font-mono">
                    {tasaPromedioRemeseros.toFixed(2)}
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
