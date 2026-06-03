"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PeriodFilter, type Period } from "@/components/shared/period-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, TrendingUp, Wallet, Globe } from "lucide-react";
import { TasaEltoqueCard } from "@/components/dashboard/tasa-eltoque-card";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface DashboardData {
  balanceUsd: number;
  balanceCup: number;
  gananciaCup: number;
  remeserosActivos: number;
  totalRemeseros: number;
  wiresPendientesCount: number;
  wiresPendientesUsd: number;
  tasaGlobal: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.5rem] font-bold text-[#1a1a1a]">Panel Financiero</h2>
        <PeriodFilter value={period} onChange={(p, from, to) => handlePeriodChange(p, from, to)} />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <KpiCard title="Balance USD" value={formatCurrency(data.balanceUsd, "USD")} icon={Wallet} loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard title="Balance CUP" value={formatCurrency(data.balanceCup, "CUP")} icon={Wallet} loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard title="Ganancia CUP" value={formatCurrency(data.gananciaCup, "CUP")} icon={TrendingUp} loading={loading} trend={gananciaCupTrend} />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard title="Wires Pendientes" value={`${data.wiresPendientesCount}`} subtitle={`${formatCurrency(data.wiresPendientesUsd, "USD")} por cobrar`} icon={Clock} loading={loading} />
        </motion.div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        <motion.div variants={item}>
          <KpiCard title="Remeseros Activos" value={`${data.remeserosActivos} / ${data.totalRemeseros}`} icon={Users} loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <div className="rounded-xl ring-1 ring-border bg-white p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase font-bold text-[#6b7280] tracking-wider">Tasa USD Global</p>
              <Globe className="size-5 text-[#9ca3af]" />
            </div>
            <div className="mt-2">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(data.tasaGlobal)}</span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <TasaEltoqueCard />
        </motion.div>
      </motion.div>
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
  const valueColor = trend === "+" ? "text-[#059669]" : trend === "-" ? "text-[#dc2626]" : "text-[#1a1a1a]";

  return (
    <div className="rounded-xl ring-1 ring-border bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase font-bold text-[#6b7280] tracking-wider">{title}</p>
        <Icon className="size-5 text-[#9ca3af]" />
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        )}
        {subtitle && <p className="text-xs text-[#6b7280] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
