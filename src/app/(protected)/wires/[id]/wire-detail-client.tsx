"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AbonoModal } from "@/components/wires/abono-modal";
import type { AbonoWireFormData } from "@/lib/validations";

export function WireDetailClient({ wireId }: { wireId: string }) {
  const router = useRouter();
  const [abonoModalOpen, setAbonoModalOpen] = useState(false);

  const handleAbono = useCallback(
    async (data: AbonoWireFormData) => {
      try {
        const res = await fetch(`/api/wires/${wireId}/abonos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Error al registrar abono");
          return;
        }
        toast.success("Abono registrado");
        setAbonoModalOpen(false);
        router.refresh();
      } catch {
        toast.error("Error al registrar abono");
      }
    },
    [wireId, router]
  );

  return (
    <>
      <Button
        onClick={() => setAbonoModalOpen(true)}
        size="sm"
      >
        <Plus className="size-4" />
        Nuevo Pago
      </Button>
      <AbonoModal
        open={abonoModalOpen}
        onOpenChange={setAbonoModalOpen}
        onSubmit={handleAbono}
      />
    </>
  );
}
