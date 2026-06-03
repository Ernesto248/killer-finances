import { requireAuth } from "@/lib/auth";
import { ReportesClient } from "./reportes-client";
import { PageTransition } from "@/components/shared/page-transition";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  await requireAuth();
  return <PageTransition><ReportesClient /></PageTransition>;
}
