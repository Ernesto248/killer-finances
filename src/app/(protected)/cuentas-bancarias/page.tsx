import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CuentaTable } from "@/components/cuentas/cuenta-table";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CuentasBancariasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rawCuentas = await prisma.cuentaBancaria.findMany({
    orderBy: { createdAt: "desc" },
  });

  const cuentas = JSON.parse(JSON.stringify(rawCuentas));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas Bancarias</h2>
        <p className="text-muted-foreground">
          Gestiona tus cuentas Zelle, bancarias y efectivo.
        </p>
      </div>
      <CuentaTable cuentas={cuentas} userRole={user.role} />
    </div>
  );
}
