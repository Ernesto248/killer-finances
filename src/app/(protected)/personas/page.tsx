import { requireAuth } from "@/lib/auth";
import { PersonaTable } from "@/components/personas/persona-table";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personas</h2>
        <p className="text-muted-foreground">
          Gestiona tus remeseros, compradores y proveedores
        </p>
      </div>
      <PersonaTable />
    </div>
  );
}
