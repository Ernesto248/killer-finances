import { requireAuth } from "@/lib/auth";
import { PagoTable } from "@/components/pagos/pago-table";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await requireAuth();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pagos</h2>
        <p className="text-muted-foreground">
          Registra los pagos realizados a remeseros, compradores y proveedores
        </p>
      </div>
      <PagoTable />
    </div>
    </PageTransition>
  );
}
