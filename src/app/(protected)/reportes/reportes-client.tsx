"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, TrendingUp } from "lucide-react";

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

export function ReportesClient() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground">Consultas y resumenes del negocio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
