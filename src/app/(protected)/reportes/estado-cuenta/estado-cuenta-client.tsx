"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PersonaOption {
  id: string;
  nombre: string;
  alias: string | null;
}

interface EstadoCuentaData {
  persona: { id: string; nombre: string; alias: string | null };
  balanceInicial: { usd: number; cup: number };
  cuadres: Array<{
    id: string;
    fecha: string;
    nota: string | null;
    deudaInicialCup: number;
    pagadoCup: number;
    deudaFinalCup: number;
    totalZelleUsd: number;
    tasaPromedioCup: number;
    lineas: Array<unknown>;
  }>;
  pagos: Array<{
    id: string;
    fecha: string;
    monto: number;
    moneda: string;
    descripcion: string | null;
  }>;
  wires: Array<{
    id: string;
    fecha: string;
    montoUsd: number;
    tasaPactada: number;
    montoCupTotal: number;
    montoPagadoCup: number;
    estado: string;
  }>;
  balanceFinal: { usd: number; cup: number };
}

export function EstadoCuentaClient() {
  const [personaId, setPersonaId] = useState("");
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [personasLoaded, setPersonasLoaded] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<EstadoCuentaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPersonas = async () => {
    if (personasLoaded) return;
    try {
      const res = await fetch("/api/personas");
      if (res.ok) {
        const json = await res.json();
        setPersonas(json.filter((p: { activo: boolean }) => p.activo));
      }
      setPersonasLoaded(true);
    } catch {
      // ignore
    }
  };

  const generar = async () => {
    if (!personaId || !from || !to) {
      setError("Selecciona una persona y un rango de fechas");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reportes/estado-cuenta?personaId=${personaId}&from=${from}&to=${to}`
      );
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Error al generar reporte");
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Error al generar reporte");
    } finally {
      setLoading(false);
    }
  };

  const rows: Array<{
    fecha: string;
    tipo: string;
    descripcion: string;
    montoUsd: number;
    montoCup: number;
  }> = [];

  if (data) {
    for (const c of data.cuadres) {
      rows.push({
        fecha: c.fecha,
        tipo: "Cuadre",
        descripcion: c.nota ?? `Deuda: ${formatCurrency(Number(c.deudaInicialCup), "CUP")} → ${formatCurrency(Number(c.deudaFinalCup), "CUP")}`,
        montoUsd: Number(c.totalZelleUsd),
        montoCup: Number(c.deudaFinalCup) - Number(c.deudaInicialCup) + Number(c.pagadoCup),
      });
    }
    for (const p of data.pagos) {
      rows.push({
        fecha: p.fecha,
        tipo: "Pago",
        descripcion: p.descripcion ?? `Pago en ${p.moneda}`,
        montoUsd: p.moneda === "USD" ? Number(p.monto) * -1 : 0,
        montoCup: p.moneda === "CUP" ? Number(p.monto) * -1 : 0,
      });
    }
    for (const w of data.wires) {
      rows.push({
        fecha: w.fecha,
        tipo: "Wire",
        descripcion: `Wire ${w.estado} - Tasa: ${w.tasaPactada}`,
        montoUsd: 0,
        montoCup: Number(w.montoCupTotal),
      });
    }
    rows.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estado de Cuenta</h2>
        <p className="text-muted-foreground">
          Consulta el estado de cuenta de una persona por rango de fechas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select
                value={personaId}
                onValueChange={(v) => setPersonaId(v ?? "")}
                onOpenChange={() => loadPersonas()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.alias ? `(${p.alias})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={generar} disabled={loading}>
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Persona</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {data.persona.nombre}
                  {data.persona.alias ? ` (${data.persona.alias})` : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Balance Inicial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    USD: {formatCurrency(data.balanceInicial.usd, "USD")}
                  </p>
                  <p className="text-sm font-medium">
                    CUP: {formatCurrency(data.balanceInicial.cup, "CUP")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Balance Final</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary">
                    USD: {formatCurrency(data.balanceFinal.usd, "USD")}
                  </p>
                  <p className="text-sm font-bold text-primary">
                    CUP: {formatCurrency(data.balanceFinal.cup, "CUP")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                    <TableHead className="text-right">CUP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin movimientos en el rango
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {new Date(row.fecha).toLocaleDateString("es-CU")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.tipo === "Cuadre"
                                ? "default"
                                : row.tipo === "Pago"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {row.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {row.descripcion}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.montoUsd !== 0
                            ? formatCurrency(row.montoUsd, "USD")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.montoCup !== 0
                            ? formatCurrency(row.montoCup, "CUP")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
