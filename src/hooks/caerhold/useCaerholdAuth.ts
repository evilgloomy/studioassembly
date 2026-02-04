import { useAuthContext } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Hook to check Caerhold-specific roles and permissions
 */
export function useCaerholdAuth() {
  const { user, role, isLoading } = useAuthContext();

  const isCaerholdAdmin = role === ('caerhold_admin' as AppRole);
  const isCaerholdEditor = role === ('caerhold_editor' as AppRole);
  const hasCaerholdAccess = isCaerholdAdmin || isCaerholdEditor;

  return {
    user,
    role,
    isLoading,
    isCaerholdAdmin,
    isCaerholdEditor,
    hasCaerholdAccess,
  };
}
