import { requireAuth } from "@/lib/auth";
import { LoteTable } from "@/components/lotes/lote-table";

export const dynamic = "force-dynamic";

export default async function LotesPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lotes</h2>
        <p className="text-muted-foreground">
          Gestiona tus lotes, productos y ventas
        </p>
      </div>
      <LoteTable />
    </div>
  );
}
