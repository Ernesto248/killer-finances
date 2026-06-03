import { requireAuth } from "@/lib/auth";
import { LoteTable } from "@/components/lotes/lote-table";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function LotesPage() {
  await requireAuth();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lotes</h2>
        <p className="text-muted-foreground">
          Gestiona tus lotes, productos y ventas
        </p>
      </div>
      <LoteTable />
    </div>
    </PageTransition>
  );
}
