import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { AppRole } from "@/types/database";

export function useUserRole(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!user?.roles) return [];
      return user.roles.map((r) => r.role as AppRole);
    },
    enabled: !!userId && !!user,
  });
}

export function useHasRole(userId: string | undefined, role: AppRole) {
  const { data: roles, isLoading } = useUserRole(userId);
  return {
    hasRole: roles?.includes(role) ?? false,
    isLoading,
  };
}
