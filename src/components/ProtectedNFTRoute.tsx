'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Wallet, ShieldAlert } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { useDrGreenKeyOwnership } from '@/hooks/useNFTOwnership';

interface ProtectedNFTRouteProps {
  children: ReactNode;
  /**
   * Custom message to show when access is denied
   */
  accessDeniedMessage?: string;
  /**
   * Whether to show a blurred preview of the content
   */
  showBlurredPreview?: boolean;
  /**
   * Fallback component to show when loading
   */
  loadingFallback?: ReactNode;
}

/**
 * Route guard that requires NFT ownership to access content
 * Implements the "Token-Gating" pattern from the reference architecture
 */
export function ProtectedNFTRoute({
  children,
  accessDeniedMessage = 'You need a Digital Key NFT to access this content.',
  showBlurredPreview = true,
  loadingFallback,
}: ProtectedNFTRouteProps) {
  const { isConnected } = useAccount();
  const { openWalletModal } = useWallet();
  const { hasNFT, isLoading } = useDrGreenKeyOwnership();

  // Loading state
  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Verifying NFT ownership...</p>
          </div>
        </div>
      )
    );
  }

  // Not connected - prompt to connect wallet
  if (!isConnected) {
    return (
      <div className="relative min-h-[400px]">
        {/* Blurred preview */}
        {showBlurredPreview && (
          <div className="absolute inset-0 overflow-hidden blur-lg pointer-events-none opacity-30">
            {children}
          </div>
        )}
        
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              >
                <Lock className="h-8 w-8 text-primary" />
              </motion.div>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to verify your Digital Key NFT and unlock exclusive access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={openWalletModal} size="lg">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Connected but no NFT - show access denied
  if (!hasNFT) {
    return (
      <div className="relative min-h-[400px]">
        {/* Blurred preview */}
        {showBlurredPreview && (
          <div className="absolute inset-0 overflow-hidden blur-lg pointer-events-none opacity-30">
            {children}
          </div>
        )}
        
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10"
              >
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              </motion.div>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>{accessDeniedMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your connected wallet does not hold the required Digital Key NFT.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={openWalletModal}>
                  Switch Wallet
                </Button>
                <Button asChild>
                  <a href="https://drgreennft.com" target="_blank" rel="noopener noreferrer">
                    Get a Digital Key
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Has NFT - render content with unlock animation
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
