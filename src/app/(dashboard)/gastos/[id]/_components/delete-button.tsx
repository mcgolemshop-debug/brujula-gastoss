"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { eliminarGastoAction } from "../../_actions";
import { toast } from "sonner";

export function DeleteGastoButton({
  id,
  codigo,
}: {
  id: string;
  codigo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await eliminarGastoAction(id);
    setLoading(false);
    if (result.ok) {
      toast.success(`${codigo} eliminado`);
      router.push("/gastos");
      router.refresh();
    } else {
      toast.error("No se pudo eliminar", { description: result.error });
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Eliminar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Eliminar ${codigo}?`}
        description="Esta acción es permanente. La foto de factura también se borrará del storage."
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={loading}
        onConfirm={handleDelete}
      />
    </>
  );
}
