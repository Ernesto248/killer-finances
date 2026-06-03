import { requireAuth } from "@/lib/auth";
import { CuadreTableClient } from "./cuadre-table-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function CuadresPage() {
  await requireAuth();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuadres</h2>
        <p className="text-muted-foreground">
          Registra cuadres desde WhatsApp.
        </p>
      </div>
      <CuadreTableClient />
    </div>
    </PageTransition>
  );
}
