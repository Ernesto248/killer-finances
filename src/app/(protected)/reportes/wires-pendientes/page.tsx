import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WiresPendientesPage() {
  await requireAuth();

  const wires = await prisma.wire.findMany({
    where: { estado: { not: "PAGADO" } },
    orderBy: { fecha: "desc" },
    include: {
      comprador: {
        select: { id: true, nombre: true },
      },
    },
  });

  const result = wires.map((w) => {
    const pendiente = Number(w.montoCupTotal) - Number(w.montoPagadoCup);
    const diasVencido = Math.floor(
      (Date.now() - new Date(w.fecha).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: w.id,
      comprador: w.comprador.nombre,
      montoUsd: Number(w.montoUsd),
      tasaPactada: Number(w.tasaPactada),
      montoCupTotal: Number(w.montoCupTotal),
      montoPagadoCup: Number(w.montoPagadoCup),
      pendiente,
      diasVencido,
      estado: w.estado,
    };
  });

  const totalPendiente = result.reduce((s, w) => s + w.pendiente, 0);

  const estadoVariant = (estado: string) => {
    if (estado === "PENDIENTE") return "destructive";
    if (estado === "PARCIAL") return "secondary";
    return "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wires Pendientes</h2>
        <p className="text-muted-foreground">Wires que aun no han sido pagados en su totalidad</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totalPendiente, "CUP")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Cantidad de Wires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{result.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">Tasa</TableHead>
                <TableHead className="text-right">Total CUP</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="text-right">Dias Vencido</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay wires pendientes
                  </TableCell>
                </TableRow>
              ) : (
                result.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.comprador}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(w.montoUsd, "USD")}
                    </TableCell>
                    <TableCell className="text-right">{w.tasaPactada}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(w.montoCupTotal, "CUP")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(w.montoPagadoCup, "CUP")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatCurrency(w.pendiente, "CUP")}
                    </TableCell>
                    <TableCell className="text-right">{w.diasVencido} d</TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant(w.estado)}>{w.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
