import { requireAuth } from "@/lib/auth";
import { GastoTable } from "@/components/gastos/gasto-table";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  await requireAuth();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
        <p className="text-muted-foreground">
          Gestiona los gastos operativos y vinculalos a lotes
        </p>
      </div>
      <GastoTable />
    </div>
    </PageTransition>
  );
}
