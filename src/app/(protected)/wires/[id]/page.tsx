import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { WireDetailClient } from "./wire-detail-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function WireDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();

  const wireRaw = await prisma.wire.findUnique({
    where: { id: params.id },
    include: {
      comprador: { select: { id: true, nombre: true } },
      abonos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!wireRaw) notFound();

  const wire = JSON.parse(JSON.stringify(wireRaw));

  const total = Number(wire.montoCupTotal);
  const pagado = Number(wire.montoPagadoCup);
  const pendiente = Math.max(0, total - pagado);

  const estadoVariant = wire.estado === "PAGADO" ? "success" : wire.estado === "PARCIAL" ? "secondary" : "outline";

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/wires" className="inline-flex items-center justify-center size-8 rounded-full hover:bg-[#f3f4f6] transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                Wire {new Date(wire.fecha).toLocaleDateString("es-CU")}
              </h2>
              <Badge variant={estadoVariant as any}>{wire.estado}</Badge>
            </div>
            <Link href={`/personas/${wire.comprador.id}`} className="text-sm text-[#6b7280] hover:underline">
              {wire.comprador.nombre}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Monto USD</p>
              <p className="text-xl font-bold">{formatCurrency(Number(wire.montoUsd), "USD")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Tasa Pactada</p>
              <p className="text-xl font-bold">{Number(wire.tasaPactada).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Total CUP</p>
              <p className="text-xl font-bold">{formatCurrency(total, "CUP")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Pagado</p>
              <p className="text-xl font-bold text-[#059669]">{formatCurrency(pagado, "CUP")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Pendiente</p>
              <p className="text-xl font-bold text-[#dc2626]">{formatCurrency(pendiente, "CUP")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-bold text-[#6b7280] uppercase mb-1">Ganancia CUP</p>
              <p className={`text-xl font-bold ${Number(wire.gananciaCup) >= 0 ? "text-[#059669]" : "text-[#dc2626]"}`}>
                {formatCurrency(Number(wire.gananciaCup), "CUP")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold">Abonos ({wireRaw.abonos.length})</h3>
            <WireDetailClient wireId={wire.id} />
          </div>
          <CardContent>
            {wire.abonos.length === 0 ? (
              <p className="text-sm text-[#6b7280] text-center py-4">No hay abonos registrados</p>
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
                  {wire.abonos.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{new Date(a.fecha).toLocaleDateString("es-CU")}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(a.monto), a.moneda)}</TableCell>
                      <TableCell><Badge variant="outline">{a.moneda}</Badge></TableCell>
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
