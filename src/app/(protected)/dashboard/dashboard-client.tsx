"use client";

import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/shared/period-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Clock, TrendingUp } from "lucide-react";
import { TasaEltoqueCard } from "@/components/dashboard/tasa-eltoque-card";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface DashboardData {
  balanceUsd: number;
  balanceCup: number;
  gananciaCup: number;
  gananciaUsd: number;
  remeserosActivos: number;
  totalRemeseros: number;
  wiresPendientes: number;
  wiresPendientesUsd: number;
  tasaGlobal: number;
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = async (p: Period, from?: Date, to?: Date) => {
    setPeriod(p);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from.toISOString());
      if (to) params.set("to", to.toISOString());
      params.set("period", p);
      const res = await fetch(`/api/dashboard/kpis?${params}`);
      const newData = await res.json();
      setData(newData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general de tus finanzas</p>
        </div>
        <PeriodFilter value={period} onChange={(p, from, to) => handlePeriodChange(p, from, to)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Balance USD" value={formatCurrency(data.balanceUsd, "USD")} icon={DollarSign} loading={loading} />
        <KpiCard title="Balance CUP" value={formatCurrency(data.balanceCup, "CUP")} icon={DollarSign} loading={loading} />
        <KpiCard title="Ganancia CUP" value={formatCurrency(data.gananciaCup, "CUP")} icon={TrendingUp} loading={loading} trend={data.gananciaCup > 0 ? "+" : ""} />
        <KpiCard title="Ganancia USD" value={formatCurrency(data.gananciaUsd, "USD")} icon={TrendingUp} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Remeseros Activos" value={`${data.remeserosActivos} / ${data.totalRemeseros}`} icon={Users} loading={loading} />
        <KpiCard title="Wires Pendientes" value={`${data.wiresPendientes}`} subtitle={`${formatCurrency(data.wiresPendientesUsd, "USD")} por cobrar`} icon={Clock} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
    <Card className="card-hover">
          <CardHeader><CardTitle className="text-sm">Tasa USD Global</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{formatNumber(data.tasaGlobal)}</div></CardContent>
        </Card>
        <TasaEltoqueCard />
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  trend?: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, loading, trend }: KpiCardProps) {
  return (
        <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className={`text-2xl font-bold ${trend === "+" ? "text-emerald-400" : ""}`}><AnimatedCounter value={value} /></div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
