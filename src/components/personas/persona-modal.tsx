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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personaSchema, type PersonaFormData } from "@/lib/validations";
import type { PersonaTipo } from "@/types";

interface PersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  persona?: PersonaFormData;
  onSubmit: (data: PersonaFormData) => void;
}

const tipos: { value: PersonaTipo; label: string }[] = [
  { value: "REMESERO", label: "Remesero" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "INTERMEDIARIO", label: "Intermediario" },
];

export function PersonaModal({
  open,
  onOpenChange,
  title,
  persona,
  onSubmit,
}: PersonaModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema) as never,
    defaultValues: {
      nombre: "",
      telefono: "",
      alias: "",
      tipo: "REMESERO",
      activo: true,
      balanceUsd: 0,
      balanceCup: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        persona ?? {
          nombre: "",
          telefono: "",
          alias: "",
          tipo: "REMESERO",
          activo: true,
          balanceUsd: 0,
          balanceCup: 0,
        }
      );
    }
  }, [open, persona, reset]);

  const onFormSubmit = (data: PersonaFormData) => {
    onSubmit(data);
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
              placeholder="Nombre de la persona"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              {...register("alias")}
              placeholder="Alias (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              {...register("telefono")}
              placeholder="Telefono (opcional)"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balanceUsd">Balance USD</Label>
              <Input
                id="balanceUsd"
                type="number"
                step="0.01"
                {...register("balanceUsd", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceCup">Balance CUP</Label>
              <Input
                id="balanceCup"
                type="number"
                step="0.01"
                {...register("balanceCup", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="activo" className="cursor-pointer">
              Activo
            </Label>
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="activo"
                />
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
