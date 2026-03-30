/**
 * Multi-Tenant Configuration
 * 
 * Defines branding, colors, and settings for each tenant storefront.
 * This enables the "multi-tenant dApp" architecture where the same
 * codebase serves different brands based on URL.
 */

export interface TenantConfig {
  id: string;
  name: string;
  description: string;
  tagline: string;
  logo: {
    light: string;
    dark: string;
    icon: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  nftContract?: `0x${string}`;
  apiEndpoint?: string;
  social: {
    twitter?: string;
    linkedin?: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    keywords: string;
  };
}

// Import logo assets - Full Healing Buds logos with text
import hbLogoWhite from '@/assets/hb-logo-white-full.png';
import hbLogoTeal from '@/assets/hb-logo-teal-full.png';
import hbIconTeal from '@/assets/hb-icon-teal.png';
import drGreenLogo from '@/assets/drgreen-logo.svg';
import drGreenNftLogo from '@/assets/drgreen-nft-logo.png';

/**
 * Tenant Configurations
 * 
 * Each tenant has complete branding control:
 * - Logos for light/dark modes
 * - Color scheme (maps to CSS variables)
 * - SEO metadata
 * - NFT contract for token-gating
 */
export const tenants: Record<string, TenantConfig> = {
  healingbuds: {
    id: 'healingbuds',
    name: 'Healing Buds',
    description: 'Pharmaceutical-grade medical cannabis for qualifying patients. EU GMP certified with full seed-to-sale traceability.',
    tagline: 'Shaping the Future of Cannabis',
    logo: {
      light: hbLogoTeal,
      dark: hbLogoWhite,
      icon: hbIconTeal,
    },
    colors: {
      primary: 'hsl(172, 66%, 40%)',
      secondary: 'hsl(172, 50%, 30%)',
      accent: 'hsl(172, 70%, 50%)',
    },
    social: {
      twitter: 'https://twitter.com/healingbuds',
      linkedin: 'https://linkedin.com/company/healingbuds',
    },
    seo: {
      defaultTitle: 'Healing Buds | Shaping the Future of Cannabis',
      defaultDescription: 'Leading the world in cannabis research and EU GMP-certified medical cannabis products. Consistently delivering superior products and driving global acceptance.',
      keywords: 'medical cannabis, CBD, THC, EU GMP, cannabis research, Healing Buds, Portugal cannabis, medical marijuana',
    },
  },
  
  drgreen: {
    id: 'drgreen',
    name: 'Dr. Green',
    description: 'Web3 Cannabis Infrastructure. Access the regulated cannabis ecosystem with your Digital Key NFT.',
    tagline: 'Your Digital Key to Cannabis',
    logo: {
      light: drGreenLogo,
      dark: drGreenNftLogo,
      icon: drGreenNftLogo,
    },
    colors: {
      primary: 'hsl(142, 70%, 45%)',
      secondary: 'hsl(142, 60%, 35%)',
      accent: 'hsl(142, 80%, 55%)',
    },
    // Dr. Green Digital Key NFT contract (placeholder - replace with actual)
    nftContract: '0x0000000000000000000000000000000000000000',
    social: {
      twitter: 'https://twitter.com/drgreennft',
    },
    seo: {
      defaultTitle: 'Dr. Green | Your Digital Key to Cannabis',
      defaultDescription: 'Access the regulated cannabis ecosystem through NFT-gated storefronts. Connect your wallet to unlock exclusive benefits.',
      keywords: 'Dr. Green NFT, cannabis NFT, Web3 cannabis, digital key, medical cannabis access',
    },
  },
  
  global: {
    id: 'global',
    name: 'Cannabis Platform',
    description: 'White-label medical cannabis platform. Compliant, traceable, trusted.',
    tagline: 'Medical Cannabis, Simplified',
    logo: {
      light: hbLogoTeal,
      dark: hbLogoWhite,
      icon: hbIconTeal,
    },
    colors: {
      primary: 'hsl(172, 66%, 40%)',
      secondary: 'hsl(172, 50%, 30%)',
      accent: 'hsl(172, 70%, 50%)',
    },
    social: {},
    seo: {
      defaultTitle: 'Medical Cannabis Platform',
      defaultDescription: 'Compliant medical cannabis access with full traceability.',
      keywords: 'medical cannabis, compliant cannabis, cannabis platform',
    },
  },
};

// Default tenant when no specific tenant is matched
export const DEFAULT_TENANT_ID = 'healingbuds';

/**
 * Get tenant config by ID, with fallback to default
 */
export function getTenantConfig(tenantId?: string): TenantConfig {
  if (tenantId && tenants[tenantId]) {
    return tenants[tenantId];
  }
  return tenants[DEFAULT_TENANT_ID];
}

/**
 * Check if a tenant ID is valid
 */
export function isValidTenant(tenantId: string): boolean {
  return tenantId in tenants;
}
