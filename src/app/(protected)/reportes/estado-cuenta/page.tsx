import { requireAuth } from "@/lib/auth";
import { EstadoCuentaClient } from "./estado-cuenta-client";

export const dynamic = "force-dynamic";

export default async function EstadoCuentaPage() {
  await requireAuth();
  return <EstadoCuentaClient />;
}
