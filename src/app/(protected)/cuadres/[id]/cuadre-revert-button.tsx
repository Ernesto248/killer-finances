"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RotateCcw } from "lucide-react";

export function CuadreRevertButton({ cuadreId }: { cuadreId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleRevert = async () => {
    try {
      const res = await fetch(`/api/cuadres/${cuadreId}/revert`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al revertir");
        return;
      }
      toast.success("Cuadre revertido");
      setOpen(false);
      router.push("/cuadres");
    } catch {
      toast.error("Error al revertir");
    }
  };

  return (
    <>
      <Button size="sm" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs" onClick={() => setOpen(true)}>
        <RotateCcw className="size-3 mr-1" />
        Revertir Cuadre
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revertir Cuadre"
        description="Se eliminara el cuadre y sus lineas. Los balances del remesero se revertiran."
        onConfirm={handleRevert}
        confirmLabel="Revertir"
        variant="destructive"
      />
    </>
  );
}
