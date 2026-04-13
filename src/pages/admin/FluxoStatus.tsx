import AdminLayout from "@/components/layout/AdminLayout";
import StatusConfigCard from "@/components/admin/StatusConfigCard";

export default function FluxoStatus() {
  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="text-xl font-bold">Fluxo de Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as fases do pedido e defina quais etapas se aplicam a cada tipo.
          </p>
        </div>
        <StatusConfigCard />
      </div>
    </AdminLayout>
  );
}
