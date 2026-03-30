/**
 * KYC Status Badge Component
 * 
 * ADHD-Safe persistent visual indicator for verification status.
 * States: Not Registered, Pending, Action Required, Verified, Failed
 */

import { useMemo } from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShop } from '@/context/ShopContext';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type KYCStatus = 'not_started' | 'pending' | 'action_required' | 'verified' | 'rejected' | 'sync_required';

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  className: string;
  href?: string;
}

export function KYCStatusBadge() {
  const { drGreenClient, isLoading } = useShop();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const status: KYCStatus = useMemo(() => {
    if (!drGreenClient) return 'not_started';
    
    // Check for local-only client (API sync failed)
    if (drGreenClient.drgreen_client_id?.startsWith('local-')) {
      return 'sync_required';
    }
    
    if (drGreenClient.is_kyc_verified && drGreenClient.admin_approval === 'VERIFIED') {
      return 'verified';
    }
    if (drGreenClient.admin_approval === 'REJECTED') {
      return 'rejected';
    }
    if (drGreenClient.kyc_link && !drGreenClient.is_kyc_verified) {
      return 'action_required';
    }
    return 'pending';
  }, [drGreenClient]);

  // Don't show KYC badge for admin users - they don't need patient verification
  if (isAdmin && !roleLoading) {
    return null;
  }

  const config: Record<KYCStatus, StatusConfig> = {
    not_started: {
      label: 'Not Registered',
      icon: User,
      className: 'bg-muted text-muted-foreground hover:bg-muted/80',
      href: '/shop/register',
    },
    pending: {
      label: 'Verification Pending',
      icon: Clock,
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      href: '/dashboard/status',
    },
    action_required: {
      label: 'Action Required',
      icon: AlertTriangle,
      className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 animate-pulse',
      href: '/dashboard/status',
    },
    verified: {
      label: 'Verified',
      icon: CheckCircle,
      className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    rejected: {
      label: 'Verification Failed',
      icon: XCircle,
      className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      href: '/support',
    },
    sync_required: {
      label: 'Sync Required',
      icon: AlertTriangle,
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      href: '/dashboard/status',
    },
  };

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-muted/50 animate-pulse">
        <Clock className="w-3 h-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  const { label, icon: Icon, className, href } = config[status];

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        'transition-all duration-300 cursor-pointer',
        className
      )}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );

  if (href) {
    return <Link to={href}>{badge}</Link>;
  }

  return badge;
}

export default KYCStatusBadge;
