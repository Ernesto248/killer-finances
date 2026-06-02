"use client";

import { SessionProvider } from "next-auth/react";
import { CuadreTable } from "@/components/cuadres/cuadre-table";

export function CuadreTableClient() {
  return (
    <SessionProvider>
      <CuadreTable />
    </SessionProvider>
  );
}
