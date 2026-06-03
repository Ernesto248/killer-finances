import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WireDetailClient } from "./wire-detail-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

function num(d: unknown): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (d && typeof d === "object" && "$numberDecimal" in d) {
    return Number((d as { $numberDecimal: string }).$numberDecimal);
  }
  return 0;
}

function formatFecha(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleDateString("es-CU", {
    dateStyle: "medium",
  });
}

function estadoBadge(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return <Badge variant="outline">{estado}</Badge>;
    case "PARCIAL":
      return <Badge variant="secondary">{estado}</Badge>;
    case "PAGADO":
      return <Badge variant="default">{estado}</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

interface PageProps {
  params: { id: string };
}

export default async function WireDetailPage({ params }: PageProps) {
  await requireAuth();

  const wire = await prisma.wire.findUnique({
    where: { id: params.id },
    include: {
      comprador: true,
      abonos: {
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!wire) notFound();

  const total = num(wire.montoCupTotal);
  const pagado = num(wire.montoPagadoCup);
  const pendiente = total - pagado;

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/wires" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Wire {formatFecha(wire.fecha)}
            </h2>
            {estadoBadge(wire.estado)}
          </div>
          <p className="text-muted-foreground">
            <Link
              href={`/personas/${wire.comprador.id}`}
              className="hover:underline"
            >
              {wire.comprador.nombre}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monto USD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(num(wire.montoUsd), "USD")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Pactada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {num(wire.tasaPactada).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total CUP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(total, "CUP")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-[#30d158]">
              {formatCurrency(pagado, "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {formatCurrency(Math.max(0, pendiente), "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganancia CUP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                num(wire.gananciaCup) >= 0 ? "text-[#30d158]" : "text-destructive"
              }`}
            >
              {formatCurrency(num(wire.gananciaCup), "CUP")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Abonos ({wire.abonos.length})</CardTitle>
          <WireDetailClient wireId={wire.id} />
        </CardHeader>
        <CardContent>
          {wire.abonos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay abonos registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Moneda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wire.abonos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatFecha(a.fecha)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(num(a.monto), a.moneda as "USD" | "CUP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.moneda}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
