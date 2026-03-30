import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Cart } from '@/components/shop/Cart';
import { FloatingCartButton } from '@/components/shop/FloatingCartButton';
import { RestrictedRegionGate } from '@/components/shop/RestrictedRegionGate';
import { VerificationProgress } from '@/components/shop/VerificationProgress';
import strainsHeroBg from '@/assets/strains-hero-bg.jpg';

import { useShop } from '@/context/ShopContext';
import { useTranslation } from 'react-i18next';

const countries = [
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export default function Shop() {
  const { countryCode, drGreenClient, isEligible, syncVerificationFromDrGreen } = useShop();
  const { t } = useTranslation('shop');

  // NOTE: Country is determined by URL domain in ShopContext - no override needed here

  // Background polling for verification status (every 3 minutes)
  useEffect(() => {
    // Only poll if user has a client record but is not yet eligible
    if (!drGreenClient || isEligible) return;

    // Initial sync
    syncVerificationFromDrGreen();

    // Set up interval for polling every 3 minutes
    const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes
    const intervalId = setInterval(() => {
      console.log('Background sync: checking verification status...');
      syncVerificationFromDrGreen();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [drGreenClient, isEligible, syncVerificationFromDrGreen]);

  return (
    <>
      <SEOHead
        title={`${t('title')} | Dr. Green - Premium Cultivars`}
        description="Browse our selection of pharmaceutical-grade medical cannabis cultivars. Lab-tested, doctor-approved products for qualified patients."
        keywords="medical cannabis, CBD, THC, cultivars, pharmaceutical grade, Portugal, medical marijuana, dispensary"
      />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section with background image */}
        <section className="relative pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <img
              src={strainsHeroBg}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
          </div>

          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
                Strains
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {t('subtitle')}
              </p>

              {/* Eligibility status badges */}
              {drGreenClient && isEligible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium bg-primary/10 border border-primary/25 text-primary backdrop-blur-sm"
                >
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="tracking-wide text-xs font-semibold uppercase">
                    Verified Medical Patient
                  </span>
                </motion.div>
              )}

              {drGreenClient && !isEligible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium bg-highlight/10 border border-highlight/30 text-highlight backdrop-blur-sm"
                >
                  <div className="p-1.5 rounded-lg bg-highlight/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="tracking-wide text-xs font-semibold">Verification Pending</span>
                </motion.div>
              )}

              {drGreenClient && <VerificationProgress />}
            </motion.div>
          </div>
        </section>

        {/* Products - gated by region restrictions */}

        {/* Products - gated by region restrictions */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <RestrictedRegionGate countryCode={countryCode}>
              <ProductGrid />
            </RestrictedRegionGate>
          </div>
        </section>

        {/* Floating Cart Button */}
        <FloatingCartButton />

        {/* Cart drawer */}
        <Cart />

        <Footer />
      </div>
    </>
  );
}
