import { requireAuth } from "@/lib/auth";
import { GananciasClient } from "./ganancias-client";

export const dynamic = "force-dynamic";

export default async function GananciasPage() {
  await requireAuth();
  return <GananciasClient />;
}
