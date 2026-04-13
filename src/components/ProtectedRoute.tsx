import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTelas } from "@/hooks/usePerfilPermissoes";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface Props {
  children: React.ReactNode;
  telaKey?: string;
}

export default function ProtectedRoute({ children, telaKey }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, telas, isLoading } = useUserTelas(user?.id);
  const { slug } = useParams();

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin always has access
  if (isAdmin) return <>{children}</>;

  // If a telaKey is specified, check if user has access
  if (telaKey && !telas.includes(telaKey)) {
    // Redirect to first allowed tela instead of /login to avoid loop
    if (telas.length > 0 && slug) {
      return <Navigate to={`/admin/${slug}/${telas[0]}`} replace />;
    }
    // No telas at all — back to empresa selection
    return <Navigate to="/admin" replace />;
  }

  // If no telaKey specified, any authenticated user with any role passes
  return <>{children}</>;
}
