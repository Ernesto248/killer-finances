import { requireAuth } from "@/lib/auth";
import { CuadreTableClient } from "./cuadre-table-client";

export const dynamic = "force-dynamic";

export default async function CuadresPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuadres</h2>
        <p className="text-muted-foreground">
          Registra cuadres desde WhatsApp.
        </p>
      </div>
      <CuadreTableClient />
    </div>
  );
}
