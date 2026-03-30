import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, UserCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShop } from '@/context/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

// Countries with restricted cannabis product display (require verification)
const RESTRICTED_COUNTRIES = ['GB', 'PT'];

interface RestrictedRegionGateProps {
  children: React.ReactNode;
  countryCode: string;
}

export function RestrictedRegionGate({ children, countryCode }: RestrictedRegionGateProps) {
  const navigate = useNavigate();
  const { drGreenClient, isEligible, isLoading } = useShop();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isRestricted = RESTRICTED_COUNTRIES.includes(countryCode);

  // If not a restricted country, show products freely
  if (!isRestricted) {
    return <>{children}</>;
  }

  // Admin bypass — admins can always browse products regardless of region
  if (isAdmin) {
    return <>{children}</>;
  }

  // Loading state
  if (checkingAuth || isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in - require login
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto py-12"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Account Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Due to regulations in your region, you must sign in and complete medical verification 
              to view our product catalog.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <ShieldAlert className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
              <p>
                Medical cannabis products in the UK and Portugal are only available to 
                verified patients with valid prescriptions.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => navigate('/auth')} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
              <Button variant="outline" onClick={() => navigate('/shop/register')} className="w-full">
                Check Eligibility
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Logged in but not registered as client
  if (!drGreenClient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto py-12"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <ShieldAlert className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Medical Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              To comply with UK/Portugal regulations, you must complete our patient registration 
              and medical verification process before viewing products.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Registration includes:</p>
              <ul className="text-muted-foreground space-y-1 text-left">
                <li>• Personal information</li>
                <li>• Shipping address verification</li>
                <li>• Medical questionnaire</li>
                <li>• KYC identity verification</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/shop/register')} className="w-full">
              Start Patient Registration
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Registered but not verified
  if (!isEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto py-12"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <UserCheck className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Verification Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Your patient registration is under review. You'll be able to view and purchase 
              products once your verification is complete.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>KYC Verification</span>
                <span className={drGreenClient.is_kyc_verified ? 'text-primary' : 'text-yellow-500'}>
                  {drGreenClient.is_kyc_verified ? '✓ Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Medical Approval</span>
                <span className={drGreenClient.admin_approval === 'VERIFIED' ? 'text-primary' : 'text-yellow-500'}>
                  {drGreenClient.admin_approval === 'VERIFIED' ? '✓ Approved' : drGreenClient.admin_approval}
                </span>
              </div>
            </div>

            {drGreenClient.kyc_link && !drGreenClient.is_kyc_verified && (
              <Button 
                variant="outline" 
                onClick={() => window.open(drGreenClient.kyc_link!, '_blank')}
                className="w-full"
              >
                Complete KYC Verification
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Verification typically takes 1-2 business days. You'll receive an email once approved.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Verified - show products
  return <>{children}</>;
}
