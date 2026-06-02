import { requireAuth } from "@/lib/auth";
import { WireTable } from "@/components/wires/wire-table";

export const dynamic = "force-dynamic";

export default async function WiresPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wires</h2>
        <p className="text-muted-foreground">
          Registro de venta de USD acumulados con tasa pactada y ganancia
          calculada
        </p>
      </div>
      <WireTable />
    </div>
  );
}
