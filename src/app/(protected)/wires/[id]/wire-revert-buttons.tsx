"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RotateCcw, X } from "lucide-react";

export function WireRevertButtons({ wireId, abonoId, redirectUrl }: {
  wireId?: string;
  abonoId?: string;
  redirectUrl?: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRevert = async () => {
    try {
      let url: string;
      if (abonoId) {
        url = `/api/wires/abonos/${abonoId}/revert`;
      } else if (wireId) {
        url = `/api/wires/${wireId}/revert`;
      } else {
        return;
      }

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al revertir");
        return;
      }
      toast.success(abonoId ? "Pago revertido" : "Wire revertido");
      setConfirmOpen(false);
      if (redirectUrl) router.push(redirectUrl);
      router.refresh();
    } catch {
      toast.error("Error al revertir");
    }
  };

  if (abonoId) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[#dc2626] hover:bg-[#fef2f2]"
          onClick={() => setConfirmOpen(true)}
          title="Revertir pago"
        >
          <X className="size-3" />
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Revertir Pago"
          description="Se eliminara este pago y se actualizara el saldo pendiente del wire."
          onConfirm={handleRevert}
          confirmLabel="Revertir"
          variant="destructive"
        />
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs"
        onClick={() => setConfirmOpen(true)}
      >
        <RotateCcw className="size-3 mr-1" />
        Revertir Wire
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Revertir Wire"
        description="Se eliminara el wire completo, todos sus abonos, y se revertira el balance del comprador."
        onConfirm={handleRevert}
        confirmLabel="Revertir"
        variant="destructive"
      />
    </>
  );
}
