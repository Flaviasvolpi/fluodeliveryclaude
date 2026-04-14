import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/format";

interface CupomPedidoProps {
  pedido: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CupomPedido({ pedido, open, onOpenChange }: CupomPedidoProps) {
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (open && pedido && !hasPrinted.current) {
      hasPrinted.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
    if (!open) {
      hasPrinted.current = false;
    }
  }, [open, pedido]);

  if (!pedido) return null;

  const createdAt = new Date(pedido.created_at);
  const dateStr = createdAt.toLocaleDateString("pt-BR");
  const timeStr = createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const formaPagNome = pedido.formas_pagamento?.nome ?? "Não informado";
  const isPago = pedido.pagamento_status === "pago";
  const isEntrega = pedido.tipo === "entrega";
  const isMesa = pedido.tipo === "mesa";
  const endereco = pedido.endereco as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white text-black print:shadow-none print:border-none">
        <DialogTitle className="sr-only">Cupom do Pedido #{pedido.numero_sequencial}</DialogTitle>
        <div className="cupom-print p-4 font-mono text-xs leading-relaxed" style={{ width: "80mm", margin: "0 auto" }}>
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <p className="text-sm font-bold tracking-wide">ESTABELECIMENTO</p>
          </div>

          {/* Order info */}
          <div className="flex justify-between border-b border-dashed border-gray-400 pb-2 mb-2">
            <span className="font-bold">Pedido #{pedido.numero_sequencial}</span>
            <span>{dateStr} {timeStr}</span>
          </div>

          {/* Client */}
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
            <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
            {pedido.cliente_telefone && <p><strong>Tel:</strong> {pedido.cliente_telefone}</p>}
            <p><strong>Tipo:</strong> {isMesa ? `MESA — ${pedido.mesa?.nome ?? "Mesa"}` : isEntrega ? "ENTREGA" : "RETIRADA"}</p>
            {isEntrega && endereco && (
              <p><strong>End:</strong> {endereco.rua}{endereco.numero ? `, ${endereco.numero}` : ""}{endereco.bairro ? ` - ${endereco.bairro}` : ""}{endereco.complemento ? ` (${endereco.complemento})` : ""}</p>
            )}
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-1">
            {pedido.itens?.map((item: any) => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span>
                    {item.qtd}x {item.nome_snapshot}
                    {item.variante_nome_snapshot && ` (${item.variante_nome_snapshot})`}
                  </span>
                  <span>{formatBRL(item.preco_unit_snapshot * item.qtd)}</span>
                </div>
                {item.observacao_item && (
                  <p className="pl-3 text-[10px] italic">Obs: {item.observacao_item}</p>
                )}
                {item.adicionais?.map((ad: any) => (
                  <div key={ad.id} className="flex justify-between pl-3">
                    <span>+ {ad.nome_snapshot}{ad.qtd > 1 ? ` x${ad.qtd}` : ""}</span>
                    <span>{formatBRL(ad.preco_snapshot * ad.qtd)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatBRL(pedido.subtotal)}</span>
            </div>
            {pedido.taxa_entrega > 0 && (
              <div className="flex justify-between">
                <span>Taxa entrega:</span>
                <span>{formatBRL(pedido.taxa_entrega)}</span>
              </div>
            )}
            {pedido.desconto > 0 && (
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>-{formatBRL(pedido.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>{formatBRL(pedido.total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="text-center space-y-1 pt-1">
            <p><strong>Pagamento:</strong> {formaPagNome}</p>
            {isPago ? (
              <p className="font-bold">✓ PAGO</p>
            ) : (
              <p className="font-bold text-sm">*** A PAGAR{isEntrega ? " NA ENTREGA" : ""} ***</p>
            )}
          </div>

          {/* Observations */}
          {pedido.observacoes && (
            <div className="border-t border-dashed border-gray-400 mt-2 pt-2">
              <p><strong>Obs:</strong> {pedido.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
