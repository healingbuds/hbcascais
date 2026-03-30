import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, MapPin, Calendar, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

type EligibilityReason = 'age' | 'postal' | 'unknown';

interface LocationState {
  reason?: EligibilityReason;
  country?: string;
  minimumAge?: number;
}

const reasonConfig: Record<EligibilityReason, {
  icon: typeof ShieldX;
  title: string;
  description: string;
  helpText: string;
}> = {
  age: {
    icon: Calendar,
    title: 'Age Requirement Not Met',
    description: 'You do not meet the minimum age requirement for medical cannabis registration in your region.',
    helpText: 'Medical cannabis regulations require patients to be of legal age. This is a regulatory requirement that cannot be bypassed.',
  },
  postal: {
    icon: MapPin,
    title: 'Delivery Not Available',
    description: 'Medical cannabis delivery is not currently available in your postal zone.',
    helpText: 'We can only deliver to regions where we have the appropriate licensing and regulatory approval. This may change in the future.',
  },
  unknown: {
    icon: ShieldX,
    title: 'Eligibility Check Failed',
    description: 'We were unable to verify your eligibility for medical cannabis services.',
    helpText: 'Please contact our support team if you believe this is an error.',
  },
};

export default function NotEligible() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const reason = state?.reason || 'unknown';
  const config = reasonConfig[reason];
  const IconComponent = config.icon;

  // Security: Clear session and local storage to prevent back-button bypass
  useEffect(() => {
    const clearSession = async () => {
      // Sign out the user to invalidate the session
      await supabase.auth.signOut();
      
      // Clear any eligibility-related local storage
      localStorage.removeItem('eligibility_form_data');
      localStorage.removeItem('onboarding_step');
      sessionStorage.clear();
    };
    
    clearSession();
  }, []);

  return (
    <>
      <SEOHead
        title="Not Eligible | Healing Buds"
        description="Information about eligibility requirements for medical cannabis services."
      />
      <Header />
      
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <IconComponent className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl text-destructive">
                  {config.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground text-lg">
                  {config.description}
                </p>
                
                {reason === 'age' && state?.minimumAge && (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Minimum age requirement in {state.country || 'your region'}:
                    </p>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {state.minimumAge}+ years old
                    </p>
                  </div>
                )}
                
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {config.helpText}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Return Home
                  </Button>
                </div>
                
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Need assistance?
                  </p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/support')}
                    className="text-primary"
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
