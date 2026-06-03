"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export function ConfiguracionClient({ tasaUsdGlobal: initialTasa }: { tasaUsdGlobal: number }) {
  const [tasa, setTasa] = useState(String(initialTasa));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = Number(tasa);
    if (!parsed || parsed <= 0) {
      toast.error("Ingrese una tasa valida positiva");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasaUsdGlobal: parsed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success("Tasa actualizada correctamente");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuracion</h2>
        <p className="text-muted-foreground">Parametros generales del sistema</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa USD Global</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tasa" className="text-sm font-medium text-[#1a1a1a]">Tasa actual (CUP por USD)</Label>
            <Input
              id="tasa"
              type="number"
              min="1"
              step="0.01"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              className="border-[#d1d5db] focus-visible:ring-[#2563eb]"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa elTOQUE</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">Proximamente</div>
        </CardContent>
      </Card>
    </div>
  );
}
