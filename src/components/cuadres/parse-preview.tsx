"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { ParsedCuadre } from "@/lib/whatsapp-parser";

interface ParsePreviewProps {
  parsed: ParsedCuadre | null;
}

export function ParsePreview({ parsed }: ParsePreviewProps) {
  if (!parsed) return null;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Badge variant={parsed.valid ? "default" : "destructive"}>
          {parsed.valid ? "Valido" : "Invalido"}
        </Badge>
        {parsed.error && (
          <span className="text-xs text-destructive">{parsed.error}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">Deuda Inicial</div>
          <div className="font-mono font-medium">
            {formatCurrency(parsed.deudaInicialCup, "CUP")}
          </div>
        </div>
        <div className="rounded-md bg-red-50 p-2 dark:bg-red-950/20">
          <div className="text-xs text-muted-foreground">Pagado</div>
          <div className="font-mono font-medium text-destructive">
            {formatCurrency(parsed.pagadoCup, "CUP")}
          </div>
        </div>
      </div>

      {parsed.lineasTirado.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            Lineas Tirado ({parsed.lineasTirado.length})
          </div>
          {parsed.lineasTirado.map((l, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1 text-xs"
            >
              <span className="font-mono">
                {formatCurrency(l.montoUsd, "USD")} &times; {l.tasa} ={" "}
                {formatCurrency(l.montoCupResultante, "CUP")}
              </span>
              <span className="text-muted-foreground">{l.modalidad}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Total Zelle</div>
          <div className="font-mono">
            {formatCurrency(parsed.totalZelleUsd, "USD")}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Tasa Promedio</div>
          <div className="font-mono">{parsed.tasaPromedioCup.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <div className="text-xs text-muted-foreground">Deuda Final</div>
        <div className="font-mono text-base font-bold">
          {formatCurrency(parsed.deudaFinalCup, "CUP")}
        </div>
      </div>
    </div>
  );
}
