import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Clock, TrendingUp } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    cuentas,
    config,
    remeserosActivos,
    totalPersonas,
    wiresPendientes,
    gananciaCupWires,
    gananciaCupReventas,
    gananciaUsdLineas,
  ] = await Promise.all([
    prisma.cuentaBancaria.findMany(),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
    prisma.persona.count({ where: { tipo: "REMESERO", activo: true } }),
    prisma.persona.count(),
    prisma.wire.findMany({ where: { estado: { not: "PAGADO" } } }),
    prisma.wire.aggregate({ where: { fecha: { gte: startOfMonth } }, _sum: { gananciaCup: true } }),
    prisma.reventaWire.aggregate({ where: { fecha: { gte: startOfMonth } }, _sum: { gananciaCup: true } }),
    prisma.lineaCuadre.aggregate({
      where: { cuadre: { fecha: { gte: startOfMonth } } },
      _sum: { gananciaUsd: true },
    }),
  ]);

  const sumUsd = cuentas.filter((c) => c.moneda === "USD").reduce((s, c) => s + Number(c.saldoActual), 0);
  const sumCup = cuentas.filter((c) => c.moneda === "CUP").reduce((s, c) => s + Number(c.saldoActual), 0);
  const tasaGlobal = Number(config?.tasaUsdGlobal ?? 600);

  const pendienteCount = wiresPendientes.length;
  const pendienteCup = wiresPendientes.reduce(
    (s, w) => s + Number(w.montoCupTotal) - Number(w.montoPagadoCup),
    0,
  );

  const gananciaCupMes = Number(gananciaCupWires._sum.gananciaCup ?? 0) + Number(gananciaCupReventas._sum.gananciaCup ?? 0);
  const gananciaUsdMes = Number(gananciaUsdLineas._sum.gananciaUsd ?? 0);

  const kpis = [
    { title: "Balance USD", value: formatCurrency(sumUsd, "USD"), icon: DollarSign },
    { title: "Balance CUP", value: formatCurrency(sumCup, "CUP"), icon: DollarSign },
    { title: "Remeseros Activos", value: `${remeserosActivos} / ${totalPersonas}`, icon: Users },
    {
      title: "Wires Pendientes",
      value: `${pendienteCount} (${formatCurrency(pendienteCup, "CUP")})`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general de tus finanzas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganancia CUP (este mes)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(gananciaCupMes, "CUP")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganancia USD (este mes)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(gananciaUsdMes, "USD")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Tasa USD Global</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(tasaGlobal, "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Tasa elTOQUE</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">Proximamente</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
