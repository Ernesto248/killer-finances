import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfiguracionClient } from "./configuracion-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requireRole("ADMIN");

  let config = await prisma.configuracion.findUnique({ where: { id: "global" } });
  if (!config) {
    config = await prisma.configuracion.create({ data: { id: "global", tasaUsdGlobal: 600 } });
  }

  return <PageTransition><ConfiguracionClient tasaUsdGlobal={Number(config.tasaUsdGlobal)} /></PageTransition>;
}
