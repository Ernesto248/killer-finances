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
                  ? "text-[#30d158]"
                  : "text-destructive"
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
                  ? "text-[#30d158]"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(num(persona.balanceCup), "CUP")}
            </div>
          </CardContent>
        </Card>
      </div>

      {persona.cuadres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ultimos Cuadres</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total Zelle USD</TableHead>
                  <TableHead>Deuda Final CUP</TableHead>
                  <TableHead>Tasa Prom.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persona.cuadres.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {new Date(c.fecha).toLocaleDateString("es-CU")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(num(c.totalZelleUsd), "USD")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(num(c.deudaFinalCup), "CUP")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {num(c.tasaPromedioCup).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {persona.pagos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ultimos Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Descripcion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persona.pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.fecha).toLocaleDateString("es-CU")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(
                        num(p.monto),
                        p.moneda as "USD" | "CUP"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.moneda}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.descripcion || "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {persona.wiresComprados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wires Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto USD</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pagado CUP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persona.wiresComprados.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      {new Date(w.fecha).toLocaleDateString("es-CU")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(num(w.montoUsd), "USD")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.estado === "PENDIENTE" ? "secondary" : "default"
                        }
                      >
                        {w.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(num(w.montoPagadoCup), "CUP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
