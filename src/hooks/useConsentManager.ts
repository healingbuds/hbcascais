import { useState, useCallback, useEffect } from 'react';
import { useGeoLocation } from '@/hooks/useGeoLocation';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export type ConsentRegime = 'uk-gdpr' | 'popia' | 'default';

interface ConsentConfig {
  regime: ConsentRegime;
  title: string;
  description: string;
  /** Whether the regime requires explicit opt-in before any tracking */
  requiresExplicitOptIn: boolean;
}

const CONSENT_STORAGE_KEY = 'hb-cookie-consent';
const CONSENT_TIMESTAMP_KEY = 'hb-cookie-consent-at';

/**
 * Region-specific consent configurations.
 * UK GDPR: Explicit opt-in required before any tracking.
 * POPIA: Informed consent — user must be told, can decline.
 * Default: Best-practice informed consent.
 */
const consentConfigs: Record<string, ConsentConfig> = {
  GB: {
    regime: 'uk-gdpr',
    title: 'Your Privacy Matters 🇬🇧',
    description:
      'Under UK GDPR, we need your explicit consent to use cookies for analytics and marketing. No tracking occurs until you accept.',
    requiresExplicitOptIn: true,
  },
  ZA: {
    regime: 'popia',
    title: 'Your Privacy is Protected 🇿🇦',
    description:
      'In line with the Protection of Personal Information Act (POPIA), we use cookies to improve your experience. By clicking accept, you consent to our use of cookies.',
    requiresExplicitOptIn: true,
  },
  PT: {
    regime: 'default',
    title: 'We Value Your Privacy 🇵🇹',
    description:
      'We use cookies to ensure you get the best experience on our website. You can manage your preferences at any time.',
    requiresExplicitOptIn: true,
  },
  DEFAULT: {
    regime: 'default',
    title: 'We Value Your Privacy 🛡️',
    description:
      'We use cookies to ensure you get the best experience. You can accept or decline at any time.',
    requiresExplicitOptIn: false,
  },
};

export interface ConsentManager {
  /** Current consent status */
  status: ConsentStatus;
  /** Region-specific consent configuration */
  config: ConsentConfig;
  /** Whether the banner should be shown */
  showBanner: boolean;
  /** Accept all cookies */
  accept: () => void;
  /** Decline non-essential cookies */
  decline: () => void;
  /** Reset consent (e.g., from privacy settings) */
  reset: () => void;
  /** The detected country code */
  countryCode: string;
}

export const useConsentManager = (): ConsentManager => {
  const location = useGeoLocation();
  const countryCode = location.countryCode;

  const [status, setStatus] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;
    return 'pending';
  });

  const config = consentConfigs[countryCode] || consentConfigs.DEFAULT;

  const showBanner = status === 'pending';

  const accept = useCallback(() => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    setStatus('granted');
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    setStatus('denied');
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    setStatus('pending');
  }, []);

  return {
    status,
    config,
    showBanner,
    accept,
    decline,
    reset,
    countryCode,
  };
};
