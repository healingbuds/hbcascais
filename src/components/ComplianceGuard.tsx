import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ComplianceGuardProps {
  children: ReactNode;
}

export function ComplianceGuard({ children }: ComplianceGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { drGreenClient, isLoading: shopLoading } = useShop();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Wait for all loading states to complete
  const isLoading = !authChecked || shopLoading || roleLoading;

  // Check if user is verified
  const isVerified = drGreenClient?.is_kyc_verified === true && 
                    drGreenClient?.admin_approval === 'VERIFIED';

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setAuthChecked(true);
      
      if (!user) {
        // Not authenticated - redirect to auth with return path
        navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  // Redirect non-verified users to status page (must be after all other hooks)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin && !isVerified) {
      navigate('/dashboard/status', { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, isVerified, navigate]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect will happen in useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin users bypass compliance checks - they don't place orders
  if (isAdmin) {
    return <>{children}</>;
  }

  // Show loading while redirect is happening for non-verified users
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
