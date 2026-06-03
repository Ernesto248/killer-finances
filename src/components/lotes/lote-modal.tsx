"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
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
import { loteSchema, type LoteFormData } from "@/lib/validations";

interface LoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues?: LoteFormData;
  onSubmit: (data: LoteFormData) => void;
}

export function LoteModal({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
}: LoteModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoteFormData>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      nombre: "",
      costoTotal: 0,
      monedaCosto: "USD",
      productos: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "productos",
  });

  useEffect(() => {
    if (open) {
      reset(
        defaultValues ?? {
          nombre: "",
          costoTotal: 0,
          monedaCosto: "USD",
          productos: [],
        }
      );
    }
  }, [open, defaultValues, reset]);

  const onFormSubmit = (data: LoteFormData) => {
    onSubmit({
      ...data,
      costoTotal: Number(data.costoTotal) || 0,
      productos: data.productos.map((p) => ({
        ...p,
        cantidadTotal: Number(p.cantidadTotal) || 0,
        costoUnitario: Number(p.costoUnitario) || 0,
      })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Nombre del lote"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costoTotal">Costo Total</Label>
              <Input
                id="costoTotal"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                {...register("costoTotal")}
              />
              {errors.costoTotal && (
                <p className="text-sm text-destructive">
                  {errors.costoTotal.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monedaCosto">Moneda</Label>
              <Controller
                name="monedaCosto"
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
              {errors.monedaCosto && (
                <p className="text-sm text-destructive">
                  {errors.monedaCosto.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Productos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ nombre: "", cantidadTotal: 0, costoUnitario: 0 })
                }
              >
                <Plus className="size-3" />
                Agregar producto
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay productos. Agregue al menos uno.
              </p>
            )}

            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-lg border p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Producto {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Nombre del producto</Label>
                  <Input
                    {...register(`productos.${index}.nombre`)}
                    placeholder="Nombre del producto"
                  />
                  {errors.productos?.[index]?.nombre && (
                    <p className="text-sm text-destructive">
                      {errors.productos[index]?.nombre?.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cantidad total</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register(`productos.${index}.cantidadTotal`)}
                    />
                    {errors.productos?.[index]?.cantidadTotal && (
                      <p className="text-sm text-destructive">
                        {errors.productos[index]?.cantidadTotal?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Costo unitario</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.]?[0-9]*"
                      {...register(`productos.${index}.costoUnitario`)}
                    />
                    {errors.productos?.[index]?.costoUnitario && (
                      <p className="text-sm text-destructive">
                        {errors.productos[index]?.costoUnitario?.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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
