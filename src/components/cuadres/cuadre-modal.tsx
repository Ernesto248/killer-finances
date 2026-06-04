"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { Separator } from "@/components/ui/separator";
import { ParsePreview } from "./parse-preview";
import { parseWhatsAppText, type ParsedCuadre } from "@/lib/whatsapp-parser";
import { cuadreSchema, type CuadreFormData } from "@/lib/validations";

interface CuadreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface PersonaOption {
  id: string;
  nombre: string;
  alias: string | null;
}

export function CuadreModal({ open, onOpenChange, onSaved }: CuadreModalProps) {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [whatsappText, setWhatsappText] = useState("");
  const [parsed, setParsed] = useState<ParsedCuadre | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lineas, setLineas] = useState<
    { montoUsd: number; tasa: number; modalidad: string }[]
  >([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/personas")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPersonas(data);
      })
      .catch(() => toast.error("Error al cargar personas"));
  }, [open]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CuadreFormData>({
    resolver: zodResolver(cuadreSchema),
    defaultValues: {
      personaId: "",
      nota: "",
      deudaInicialCup: 0,
      pagadoCup: 0,
      deudaFinalCup: 0,
      totalZelleUsd: 0,
      tasaPromedioCup: 0,
      lineas: [],
    },
  });

  useEffect(() => {
    if (open) {
      setWhatsappText("");
      setParsed(null);
      setManualMode(false);
      setLineas([{ montoUsd: 0, tasa: 0, modalidad: "TASA" }]);
      reset({
        personaId: "",
        nota: "",
        deudaInicialCup: 0,
        pagadoCup: 0,
        deudaFinalCup: 0,
        totalZelleUsd: 0,
        tasaPromedioCup: 0,
        lineas: [],
      });
    }
  }, [open, reset]);

  const handleParse = useCallback(() => {
    const result = parseWhatsAppText(whatsappText);
    setParsed(result);
    if (result.valid) {
      reset({
        personaId: "",
        nota: "",
        deudaInicialCup: result.deudaInicialCup,
        pagadoCup: result.pagadoCup,
        deudaFinalCup: result.deudaFinalCup,
        totalZelleUsd: result.totalZelleUsd,
        tasaPromedioCup: result.tasaPromedioCup,
        lineas: result.lineasTirado.map((l) => ({
          montoUsd: l.montoUsd,
          tasa: l.tasa,
          modalidad: "TASA" as const,
          porcentajeComision: null,
          montoCupResultante: l.montoCupResultante,
          gananciaUsd: 0,
        })),
      });
    }
  }, [whatsappText, reset]);

  const addLinea = () => {
    setLineas((prev) => [...prev, { montoUsd: 0, tasa: 0, modalidad: "TASA" }]);
  };

  const removeLinea = (i: number) => {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateLinea = (
    i: number,
    field: string,
    value: number | string
  ) => {
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  };

  const onFormSubmit = async (data: CuadreFormData) => {
    if (!manualMode && parsed) {
      data = {
        personaId: data.personaId,
        nota: data.nota,
        deudaInicialCup: parsed.deudaInicialCup,
        pagadoCup: parsed.pagadoCup,
        deudaFinalCup: parsed.deudaFinalCup,
        totalZelleUsd: parsed.totalZelleUsd,
        tasaPromedioCup: parsed.tasaPromedioCup,
        lineas: parsed.lineasTirado.map((l) => ({
          montoUsd: l.montoUsd,
          tasa: l.tasa,
          modalidad: "TASA" as const,
          porcentajeComision: null,
          montoCupResultante: l.montoCupResultante,
          gananciaUsd: 0,
        })),
      };
    }

    if (manualMode) {
      const deudaFinal =
        data.deudaInicialCup -
        data.pagadoCup +
        lineas.reduce(
          (s, l) => s + Math.round(l.montoUsd * l.tasa * 100) / 100,
          0
        );
      const totalUsd = lineas.reduce((s, l) => s + l.montoUsd, 0);
      const tasaProm = totalUsd > 0
        ? Math.round(
            (lineas.reduce((s, l) => s + l.montoUsd * l.tasa, 0) / totalUsd) *
              100
          ) / 100
        : 0;

      data = {
        ...data,
        deudaFinalCup: deudaFinal,
        totalZelleUsd: totalUsd,
        tasaPromedioCup: tasaProm,
        lineas: lineas.map((l) => ({
          montoUsd: l.montoUsd,
          tasa: l.tasa,
          modalidad: l.modalidad as "TASA" | "COMISION",
          porcentajeComision: null,
          montoCupResultante: Math.round(l.montoUsd * l.tasa * 100) / 100,
          gananciaUsd: 0,
        })),
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cuadres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar cuadre");
        return;
      }
      toast.success("Cuadre guardado");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Error al guardar cuadre");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuevo Cuadre</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {!manualMode ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Pegar texto de WhatsApp</Label>
                <textarea
                  id="whatsapp"
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                  placeholder="Pega aqui el mensaje de WhatsApp..."
                  rows={6}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button
                type="button"
                onClick={handleParse}
                disabled={!whatsappText.trim()}
                className="w-full"
              >
                Parsear
              </Button>

              <ParsePreview parsed={parsed} />

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="personaId">Persona</Label>
                <Controller
                  name="personaId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {field.value && personas.find(p => p.id === field.value)?.nombre || "Seleccionar persona..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                            {p.alias ? ` (${p.alias})` : ""}
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
                <Label htmlFor="nota">Nota</Label>
                <Input
                  id="nota"
                  {...register("nota")}
                  placeholder="Nota (opcional)"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setManualMode(true);
                  setParsed(null);
                }}
                className="w-full"
              >
                Editar manualmente
              </Button>
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit(onFormSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="personaIdM">Persona</Label>
                <Controller
                  name="personaId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar persona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                            {p.alias ? ` (${p.alias})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaM">Nota</Label>
                <Input
                  id="notaM"
                  {...register("nota")}
                  placeholder="Nota (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="deudaInicial">Deuda Inicial CUP</Label>
                  <Input
                    id="deudaInicial"
                    type="text"
                    inputMode="decimal"
                    {...register("deudaInicialCup")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagado">Pagado CUP</Label>
                  <Input
                    id="pagado"
                    type="text"
                    inputMode="decimal"
                    {...register("pagadoCup")}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Lineas Tirado ({lineas.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLinea}
                  >
                    + Linea
                  </Button>
                </div>

                <AnimatePresence mode="popLayout">
                  {lineas.map((l, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border p-2"
                    >
                      <div>
                        <Label className="text-xs">USD</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={l.montoUsd || ""}
                          onChange={(e) =>
                            updateLinea(
                              i,
                              "montoUsd",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tasa</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={l.tasa || ""}
                          onChange={(e) =>
                            updateLinea(
                              i,
                              "tasa",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        {lineas.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeLinea(i)}
                          >
                            &times;
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deudaFinal">Deuda Final CUP</Label>
                <Input
                  id="deudaFinal"
                  type="text"
                  inputMode="decimal"
                  {...register("deudaFinalCup")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalZelle">Total Zelle USD</Label>
                <Input
                  id="totalZelle"
                  type="text"
                  inputMode="decimal"
                  {...register("totalZelleUsd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasaProm">Tasa Promedio</Label>
                <Input
                  id="tasaProm"
                  type="text"
                  inputMode="decimal"
                  {...register("tasaPromedioCup")}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setManualMode(false)}
                className="w-full"
              >
                Volver a pegar texto
              </Button>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  Guardar
                </Button>
              </DialogFooter>
            </motion.form>
          )}

          {!manualMode && parsed && parsed.valid && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onFormSubmit)}
                disabled={submitting}
              >
                Guardar
              </Button>
            </DialogFooter>
          )}

          {!manualMode && !parsed && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
