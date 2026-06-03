"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ArrowRightLeft, Repeat, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

interface GananciasData {
  gananciaWiresCup: number;
  gananciaReventasCup: number;
  gananciaComisionesUsd: number;
  totalWires: number;
  totalReventas: number;
  periodo: string;
}

const meses = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const BAR_COLORS = {
  "Ganancias Wire": "#2563eb",
  "Ganancias Reventa": "#059669",
  "Comisiones USD": "#dc2626",
};

export function GananciasClient() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [data, setData] = useState<GananciasData | null>(null);
  const [loading, setLoading] = useState(false);
  const initialRef = useRef(false);

  const años = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!initialRef.current) {
      initialRef.current = true;
      consultar(year, month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consultar = async (y?: string, m?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (y) params.set("year", y);
      if (m) params.set("month", m);
      const res = await fetch(`/api/reportes/ganancias?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const gananciaTotalCup = (data?.gananciaWiresCup ?? 0) + (data?.gananciaReventasCup ?? 0);

  const chartData = data
    ? [
        {
          name: "Ganancias Wire",
          value: data.gananciaWiresCup,
          subtitle: `${data.totalWires} wires`,
        },
        {
          name: "Ganancias Reventa",
          value: data.gananciaReventasCup,
          subtitle: `${data.totalReventas} reventas`,
        },
        {
          name: "Comisiones USD",
          value: data.gananciaComisionesUsd,
          subtitle: "",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resumen de Ganancias</h2>
        <p className="text-muted-foreground">Visualiza las ganancias por wire, reventa y comisiones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={month} onValueChange={(v) => setMonth(v ?? "")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select value={year} onValueChange={(v) => setYear(v ?? "")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {años.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => consultar(year, month)} disabled={loading}>
              {loading ? "Consultando..." : "Consultar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancias por Tipo
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-[#2563eb]" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={BAR_COLORS[entry.name as keyof typeof BAR_COLORS] ?? "#2563eb"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganancias CUP por Wire
                </CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.gananciaWiresCup, "CUP")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.totalWires} wires en el periodo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganancias CUP por Reventa
                </CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.gananciaReventasCup, "CUP")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.totalReventas} reventas en el periodo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganancias USD por Comision
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.gananciaComisionesUsd, "USD")}
                </div>
                <p className="text-xs text-muted-foreground">Lineas de cuadre</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancia Total CUP
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#2563eb]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2563eb]">
                {formatCurrency(gananciaTotalCup, "CUP")}
              </div>
              <p className="text-xs text-muted-foreground">Periodo: {data.periodo}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
