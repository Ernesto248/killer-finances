import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, DollarSign, ArrowRightLeft } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Timeline } from "@/components/shared/timeline";

export const dynamic = "force-dynamic";

function num(d: unknown): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (d && typeof d === "object" && "$numberDecimal" in d) {
    return Number((d as { $numberDecimal: string }).$numberDecimal);
  }
  return 0;
}

interface PageProps {
  params: { id: string };
}

export default async function PersonaDetailPage({ params }: PageProps) {
  await requireAuth();

  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: {
      cuadres: { orderBy: { fecha: "desc" }, take: 20 },
      pagos: { orderBy: { fecha: "desc" }, take: 20 },
      wiresComprados: {
        where: { estado: { not: "PAGADO" } },
        orderBy: { fecha: "desc" },
        take: 10,
      },
    },
  });

  if (!persona) notFound();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/personas" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {persona.nombre}
            </h2>
            <Badge variant={persona.activo ? "default" : "secondary"}>
              {persona.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {persona.alias && (
              <span className="mr-2">Alias: {persona.alias}</span>
            )}
            {persona.telefono && <span>Tel: {persona.telefono}</span>}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {persona.tipo}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance USD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                num(persona.balanceUsd) >= 0
                  ? "text-[#059669]"
                  : "text-[#dc2626]"
              }`}
            >
              {formatCurrency(num(persona.balanceUsd), "USD")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance CUP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                num(persona.balanceCup) >= 0
                  ? "text-[#059669]"
                  : "text-[#dc2626]"
              }`}
            >
              {formatCurrency(num(persona.balanceCup), "CUP")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={[
            ...persona.cuadres.map(c => ({
              id: c.id,
              title: `Cuadre — +${formatCurrency(Number(c.totalZelleUsd), "USD")}`,
              subtitle: `Tasa promedio: ${formatNumber(Number(c.tasaPromedioCup))}`,
              date: new Date(c.fecha).toLocaleDateString("es-CU"),
              icon: <FileText className="size-4 text-[#2563eb]" />,
              amount: formatCurrency(Number(c.deudaFinalCup), "CUP"),
              amountColor: "green" as const,
              link: `/cuadres/${c.id}`,
            })),
            ...persona.pagos.map(p => ({
              id: p.id,
              title: "Pago registrado",
              subtitle: p.descripcion || "Sin descripcion",
              date: new Date(p.fecha).toLocaleDateString("es-CU"),
              icon: <DollarSign className="size-4 text-[#dc2626]" />,
              amount: `-${formatCurrency(Number(p.monto), p.moneda as "USD" | "CUP")}`,
              amountColor: "red" as const,
            })),
            ...persona.wiresComprados.map(w => ({
              id: w.id,
              title: `Wire — ${formatCurrency(Number(w.montoUsd), "USD")} @ ${formatNumber(Number(w.tasaPactada))}`,
              subtitle: `Estado: ${w.estado}`,
              date: new Date(w.fecha).toLocaleDateString("es-CU"),
              icon: <ArrowRightLeft className="size-4 text-[#2563eb]" />,
              amount: formatCurrency(Number(w.montoCupTotal) - Number(w.montoPagadoCup), "CUP"),
              amountColor: w.estado === "PAGADO" ? "green" as const : "default" as const,
            })),
          ].sort((a, b) => new Date(b.date.split("/").reverse().join("-")).getTime() - new Date(a.date.split("/").reverse().join("-")).getTime()).slice(0, 30)} />
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
