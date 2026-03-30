'use client';

import { ReactNode } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

/**
 * Wallet Configuration for Admin NFT Gating
 * 
 * - Ethereum Mainnet only (where Dr. Green Digital Key NFTs are deployed)
 * - MetaMask and other ERC-721 compatible wallets supported via RainbowKit
 * - Admin-only feature - not exposed to customer-facing UI
 */
/**
 * Note: App name is set to a generic value here since getDefaultConfig
 * runs before React context is available. The actual tenant name
 * is displayed in the UI components that use useTenant.
 */
const config = getDefaultConfig({
  appName: 'Healing Buds',
  projectId: '0ed43641317392e224a038f3edc04ae7', // WalletConnect Cloud project ID (shared with Dr. Green DApp)
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: false,
});

// Create a separate query client for wagmi
const wagmiQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={wagmiQueryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: 'hsl(172, 66%, 40%)',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
            }),
            darkMode: darkTheme({
              accentColor: 'hsl(172, 66%, 40%)',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
            }),
          }}
          modalSize="compact"
          initialChain={mainnet}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { config };
