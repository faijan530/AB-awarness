import { useAuthStore } from '@/store/auth-store';
import { UserRole, PermissionCode } from '@/types/common.types';

export const usePermissions = () => {
  const { user, isAuthenticated, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isSuperAdmin: hasRole('SUPER_ADMIN'),
    can: (permission: PermissionCode) => hasPermission(permission),
    canAny: (permissions: PermissionCode[]) => hasAnyPermission(permissions),
    canAll: (permissions: PermissionCode[]) => hasAllPermissions(permissions),
  };
};
