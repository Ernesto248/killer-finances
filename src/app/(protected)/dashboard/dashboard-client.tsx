"use client";

import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/shared/period-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, TrendingUp, Wallet, Globe } from "lucide-react";
import { TasaEltoqueCard } from "@/components/dashboard/tasa-eltoque-card";
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

  const gananciaCupTrend = data.gananciaCup > 0 ? "+" : data.gananciaCup < 0 ? "-" : null;
  const gananciaUsdTrend = data.gananciaUsd > 0 ? "+" : data.gananciaUsd < 0 ? "-" : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-normal leading-snug tracking-[0.012em] text-white">
          Panel Financiero
        </h1>
        <PeriodFilter value={period} onChange={(p, from, to) => handlePeriodChange(p, from, to)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Balance USD" value={formatCurrency(data.balanceUsd, "USD")} icon={Wallet} loading={loading} />
        <KpiCard title="Balance CUP" value={formatCurrency(data.balanceCup, "CUP")} icon={Wallet} loading={loading} />
        <KpiCard title="Ganancia CUP" value={formatCurrency(data.gananciaCup, "CUP")} icon={TrendingUp} loading={loading} trend={gananciaCupTrend} />
        <KpiCard title="Ganancia USD" value={formatCurrency(data.gananciaUsd, "USD")} icon={TrendingUp} loading={loading} trend={gananciaUsdTrend} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Remeseros Activos" value={`${data.remeserosActivos} / ${data.totalRemeseros}`} icon={Users} loading={loading} />
        <KpiCard title="Wires Pendientes" value={`${data.wiresPendientes}`} subtitle={`${formatCurrency(data.wiresPendientesUsd, "USD")} por cobrar`} icon={Clock} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl ring-1 ring-border bg-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[#7a7a7a]">Tasa USD Global</p>
            <Globe className="size-4 text-[#7a7a7a]" />
          </div>
          <div className="mt-2">
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <span className="text-2xl font-semibold text-white">{formatNumber(data.tasaGlobal)}</span>
            )}
          </div>
        </div>
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
  trend?: string | null;
}

function KpiCard({ title, value, subtitle, icon: Icon, loading, trend }: KpiCardProps) {
  const valueColor = trend === "+" ? "text-[#30d158]" : trend === "-" ? "text-[#ff453a]" : "text-white";

  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#7a7a7a]">{title}</p>
        <Icon className="size-4 text-[#7a7a7a]" />
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <span className={`text-2xl font-semibold ${valueColor}`}>{value}</span>
        )}
        {subtitle && <p className="text-sm text-[#7a7a7a] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
