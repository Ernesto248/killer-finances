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
import { VentasSection } from "@/components/lotes/ventas-section";
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

export default async function LoteDetailPage({ params }: PageProps) {
  await requireAuth();

  const lote = await prisma.lote.findUnique({
    where: { id: params.id },
    include: {
      productos: true,
      ventas: {
        orderBy: { fecha: "desc" },
        include: {
          persona: {
            select: { id: true, nombre: true },
          },
        },
      },
      gastos: {
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!lote) notFound();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/lotes" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {lote.nombre}
          </h2>
          <p className="text-muted-foreground">
            Comprado el{" "}
            {new Date(lote.fechaCompra).toLocaleDateString("es-CU")}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {lote.monedaCosto}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-[#30d158]">
              {formatCurrency(num(lote.costoTotal), lote.monedaCosto as "USD" | "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {lote.productos.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {lote.ventas.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {lote.productos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Cant. Total</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="text-right">Restante</TableHead>
                  <TableHead className="text-right">Costo Unit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lote.productos.map((p) => {
                  const total = num(p.cantidadTotal);
                  const vendido = num(p.cantidadVendida);
                  const restante = total - vendido;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-right font-mono">
                        {total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {vendido.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          restante <= 0 ? "text-muted-foreground" : ""
                        }`}
                      >
                        {restante.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(
                          num(p.costoUnitario),
                          lote.monedaCosto as "USD" | "CUP"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <VentasSection
            loteId={lote.id}
            productos={lote.productos.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              cantidadTotal: p.cantidadTotal.toString(),
              cantidadVendida: p.cantidadVendida.toString(),
              costoUnitario: p.costoUnitario.toString(),
            }))}
            ventas={lote.ventas.map((v) => ({
              id: v.id,
              fecha: v.fecha.toISOString(),
              cantidad: v.cantidad.toString(),
              precioUnitario: v.precioUnitario.toString(),
              moneda: v.moneda,
              persona: v.persona
                ? { id: v.persona.id, nombre: v.persona.nombre }
                : null,
            }))}
          />
        </CardContent>
      </Card>

      {lote.gastos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos Asociados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Moneda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lote.gastos.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(g.fecha).toLocaleDateString("es-CU")}
                    </TableCell>
                    <TableCell>
                      {g.descripcion || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{g.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(
                        num(g.monto),
                        g.moneda as "USD" | "CUP"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.moneda}</Badge>
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
