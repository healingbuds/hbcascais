/**
 * Re-export useTenant hook from context for convenient imports
 * 
 * Usage:
 * import { useTenant } from '@/hooks/useTenant';
 * const { tenant, tenantId } = useTenant();
 */
export { useTenant } from '@/context/TenantContext';
