import { useConsentManager } from '@/hooks/useConsentManager';
import { Button } from '@/components/ui/button';
import { Shield, Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const { showBanner, config, accept, decline } = useConsentManager();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-28 left-4 right-4 z-[70] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-md pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-label="Cookie consent"
          aria-describedby="consent-description"
        >
          <div className="bg-card border border-border rounded-xl shadow-xl p-5 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                {config.regime === 'uk-gdpr' ? (
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Cookie className="w-5 h-5 text-primary shrink-0" />
                )}
                <h3 className="font-display text-base font-semibold text-foreground">
                  {config.title}
                </h3>
              </div>
              <button
                onClick={decline}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
                aria-label="Close consent banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p
              id="consent-description"
              className="text-sm text-muted-foreground leading-relaxed mb-4"
            >
              {config.description}
            </p>

            {/* Legal regime indicator */}
            {config.regime !== 'default' && (
              <div className="mb-4">
                <span className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
                  {config.regime === 'uk-gdpr'
                    ? 'UK GDPR Compliant'
                    : 'POPIA Compliant'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={decline}
                className="flex-1 text-sm"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={accept}
                className="flex-1 text-sm font-semibold"
              >
                Accept All
              </Button>
            </div>

            {/* Privacy policy link */}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Read our{' '}
              <Link
                to="/privacy-policy"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
