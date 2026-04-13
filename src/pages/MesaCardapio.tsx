import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useMesa } from "@/contexts/MesaContext";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import Index from "./Index";

export default function MesaCardapio() {
  const { token } = useParams<{ token: string }>();
  const { empresaId, slug } = useEmpresa();
  const { setMesa, mesaId } = useMesa();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token || !empresaId) return;

    async function loadMesa() {
      try {
        const { data } = await api.get(`/empresas/${empresaId}/mesas`, { params: { qr_code_token: token } });
        const mesa = Array.isArray(data) ? data.find((m: any) => m.qr_code_token === token && m.ativo) : data;
        if (!mesa) {
          setError(true);
        } else {
          setMesa(mesa.id, mesa.numero, mesa.nome);
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }

    loadMesa();
  }, [token, empresaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (error) {
    return <Navigate to={`/loja/${slug}`} replace />;
  }

  return <Index />;
}
