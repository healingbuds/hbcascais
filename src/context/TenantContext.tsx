'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TenantConfig, getTenantConfig, DEFAULT_TENANT_ID, isValidTenant } from '@/config/tenants';

interface TenantContextValue {
  // Current tenant configuration
  tenant: TenantConfig;
  tenantId: string;
  
  // Tenant switching (for admin/testing)
  setTenantId: (id: string) => void;
  
  // Helper for checking if this is the default tenant
  isDefaultTenant: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  initialTenantId?: string;
}

/**
 * Tenant Provider - Manages multi-tenant storefront configuration
 * 
 * Determines the active tenant from:
 * 1. URL path prefix (e.g., /drgreen/shop)
 * 2. Subdomain (e.g., drgreen.healingbuds.com)
 * 3. Default fallback (healingbuds)
 */
export function TenantProvider({ children, initialTenantId }: TenantProviderProps) {
  const location = useLocation();
  
  // Extract tenant from URL path
  const extractTenantFromPath = (): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    if (firstSegment && isValidTenant(firstSegment)) {
      return firstSegment;
    }
    
    return DEFAULT_TENANT_ID;
  };

  // Extract tenant from subdomain (for production)
  const extractTenantFromSubdomain = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Check for subdomain pattern: tenant.domain.com
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (isValidTenant(subdomain)) {
        return subdomain;
      }
    }
    
    return null;
  };

  const [tenantId, setTenantIdState] = useState<string>(() => {
    // Priority: initialTenantId > subdomain > path > default
    if (initialTenantId && isValidTenant(initialTenantId)) {
      return initialTenantId;
    }
    
    const subdomainTenant = extractTenantFromSubdomain();
    if (subdomainTenant) {
      return subdomainTenant;
    }
    
    return extractTenantFromPath();
  });

  // Update tenant when path changes
  useEffect(() => {
    const pathTenant = extractTenantFromPath();
    const subdomainTenant = extractTenantFromSubdomain();
    
    // Subdomain takes priority over path
    const newTenantId = subdomainTenant || pathTenant;
    
    if (newTenantId !== tenantId) {
      setTenantIdState(newTenantId);
    }
  }, [location.pathname]);

  const tenant = getTenantConfig(tenantId);

  const setTenantId = (id: string) => {
    if (isValidTenant(id)) {
      setTenantIdState(id);
    }
  };

  const value: TenantContextValue = {
    tenant,
    tenantId,
    setTenantId,
    isDefaultTenant: tenantId === DEFAULT_TENANT_ID,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant configuration
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export { TenantContext };
