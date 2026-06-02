import { requireAuth } from "@/lib/auth";
import { ReventaTable } from "@/components/reventas/reventa-table";

export const dynamic = "force-dynamic";

export default async function ReventasPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reventas</h2>
        <p className="text-muted-foreground">
          Operaciones de intermediacion - conecta comprador y vendedor con spread
        </p>
      </div>
      <ReventaTable />
    </div>
  );
}
