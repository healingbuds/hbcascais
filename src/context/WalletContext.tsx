'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useDrGreenKeyOwnership } from '@/hooks/useNFTOwnership';
import { WalletConnectionModal } from '@/components/WalletConnectionModal';

interface WalletContextValue {
  // Connection state
  isConnected: boolean;
  address: string | undefined;
  
  // NFT ownership
  hasDigitalKey: boolean;
  isCheckingNFT: boolean;
  
  // Modal control
  openWalletModal: () => void;
  closeWalletModal: () => void;
  isWalletModalOpen: boolean;
  
  // Hydration status
  isHydrated: boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

interface WalletContextProviderProps {
  children: ReactNode;
}

/**
 * Wallet Context Provider - Manages wallet connection state and NFT ownership
 * This provides the "Hydration Layer" for the dApp architecture
 */
export function WalletContextProvider({ children }: WalletContextProviderProps) {
  const { isConnected, address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { hasNFT, isLoading: nftLoading } = useDrGreenKeyOwnership();

  // App is "hydrated" when wallet is connected and NFT check is complete
  const isHydrated = isConnected && !nftLoading;

  const value: WalletContextValue = {
    isConnected,
    address,
    hasDigitalKey: hasNFT,
    isCheckingNFT: nftLoading,
    openWalletModal: () => setIsModalOpen(true),
    closeWalletModal: () => setIsModalOpen(false),
    isWalletModalOpen: isModalOpen,
    isHydrated,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      {/* Global wallet modal - accessible from anywhere */}
      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  return context;
}

export { WalletContext };
