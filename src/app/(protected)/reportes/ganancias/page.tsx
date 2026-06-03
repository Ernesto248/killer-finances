import { requireAuth } from "@/lib/auth";
import { GananciasClient } from "./ganancias-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function GananciasPage() {
  await requireAuth();
  return <PageTransition><GananciasClient /></PageTransition>;
}
