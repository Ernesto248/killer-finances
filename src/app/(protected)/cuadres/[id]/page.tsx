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

export default async function CuadreDetailPage({ params }: PageProps) {
  await requireAuth();

  const cuadre = await prisma.cuadre.findUnique({
    where: { id: params.id },
    include: {
      persona: true,
      lineas: true,
    },
  });

  if (!cuadre) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/cuadres" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Cuadre{" "}
              {new Date(cuadre.fecha).toLocaleDateString("es-CU", {
                dateStyle: "medium",
              })}
            </h2>
          </div>
          <p className="text-muted-foreground">
            <Link
              href={`/personas/${cuadre.persona.id}`}
              className="hover:underline"
            >
              {cuadre.persona.nombre}
            </Link>
            {cuadre.nota && (
              <span className="ml-2"> &mdash; {cuadre.nota}</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-muted-foreground">
              {formatCurrency(num(cuadre.deudaInicialCup), "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {formatCurrency(num(cuadre.pagadoCup), "CUP")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(num(cuadre.deudaFinalCup), "CUP")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Zelle USD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(num(cuadre.totalZelleUsd), "USD")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {num(cuadre.tasaPromedioCup).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {cuadre.lineas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lineas Tirado ({cuadre.lineas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monto USD</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead className="text-right">CUP Resultante</TableHead>
                  <TableHead>Modalidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuadre.lineas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono">
                      {formatCurrency(num(l.montoUsd), "USD")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {num(l.tasa).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(num(l.montoCupResultante), "CUP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{l.modalidad}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
