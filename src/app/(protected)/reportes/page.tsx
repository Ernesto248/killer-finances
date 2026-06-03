import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { FileText, AlertCircle, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  await requireAuth();

  const cards = [
    {
      title: "Estado de Cuenta",
      description: "Consulta el estado de cuenta de una persona por rango de fechas",
      href: "/reportes/estado-cuenta",
      icon: FileText,
    },
    {
      title: "Wires Pendientes",
      description: "Revisa todos los wires que estan pendientes de pago",
      href: "/reportes/wires-pendientes",
      icon: AlertCircle,
    },
    {
      title: "Resumen de Ganancias",
      description: "Visualiza las ganancias por wire, reventa y comisiones del mes",
      href: "/reportes/ganancias",
      icon: TrendingUp,
    },
  ];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground">Consultas y resumenes del negocio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
    </PageTransition>
  );
}
