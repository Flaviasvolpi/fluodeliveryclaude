import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  empresaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entregadorId: string) => void;
  loading?: boolean;
}

export default function SelecionarEntregadorDialog({ empresaId, open, onOpenChange, onConfirm, loading }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: entregadores } = useQuery({
    queryKey: ["entregadores-ativos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/entregadores`);
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar Entregador</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Entregador *</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um entregador" />
            </SelectTrigger>
            <SelectContent>
              {entregadores?.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!selectedId || loading} onClick={() => onConfirm(selectedId)}>
            {loading ? "Despachando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
