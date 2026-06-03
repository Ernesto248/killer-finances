import { requireAuth } from "@/lib/auth";
import { EstadoCuentaClient } from "./estado-cuenta-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function EstadoCuentaPage() {
  await requireAuth();
  return <PageTransition><EstadoCuentaClient /></PageTransition>;
}
