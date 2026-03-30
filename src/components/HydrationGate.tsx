'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HydrationGateProps {
  children: ReactNode;
  /**
   * Content to show when not hydrated (wallet not connected or NFT not verified)
   */
  lockedContent?: ReactNode;
  /**
   * Whether to show a blur overlay on locked content
   */
  showBlur?: boolean;
  /**
   * Whether to require NFT ownership (Digital Key) in addition to wallet connection
   */
  requireNFT?: boolean;
  /**
   * Custom class for the container
   */
  className?: string;
  /**
   * Whether to show the unlock CTA
   */
  showUnlockCTA?: boolean;
}

/**
 * HydrationGate - Progressive content reveal based on wallet/NFT state
 * 
 * Implements the "Hydration Pattern" from the Reference Architecture:
 * - Shows locked/blurred content for non-connected users
 * - Animates to unlocked state when wallet connects
 * - Optional NFT requirement for premium content
 */
export function HydrationGate({
  children,
  lockedContent,
  showBlur = true,
  requireNFT = false,
  className,
  showUnlockCTA = true,
}: HydrationGateProps) {
  const { isConnected, isHydrated, hasDigitalKey, openWalletModal, isCheckingNFT } = useWallet();

  // Determine if content should be unlocked
  const isUnlocked = requireNFT 
    ? isHydrated && hasDigitalKey 
    : isConnected;

  // Determine the current state message
  const getStateMessage = () => {
    if (!isConnected) {
      return 'Connect wallet to unlock';
    }
    if (isCheckingNFT) {
      return 'Verifying Digital Key...';
    }
    if (requireNFT && !hasDigitalKey) {
      return 'Digital Key NFT required';
    }
    return '';
  };

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {isUnlocked ? (
          // Unlocked state - show full content with reveal animation
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        ) : (
          // Locked state - show locked content with blur/overlay
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Locked content or children with blur */}
            <div className={cn(
              'transition-all duration-500',
              showBlur && 'blur-sm pointer-events-none select-none'
            )}>
              {lockedContent || children}
            </div>

            {/* Lock overlay */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="flex flex-col items-center gap-4 p-6 rounded-xl bg-card/90 border border-border shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              >
                {/* Lock icon with animation */}
                <motion.div
                  className="relative"
                  animate={isCheckingNFT ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {isConnected ? (
                    <Lock className="h-10 w-10 text-muted-foreground" />
                  ) : (
                    <Wallet className="h-10 w-10 text-primary" />
                  )}
                </motion.div>

                {/* State message */}
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {getStateMessage()}
                </p>

                {/* Unlock CTA */}
                {showUnlockCTA && !isConnected && (
                  <Button
                    onClick={openWalletModal}
                    className="mt-2"
                    size="sm"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Simple unlock indicator for showing hydration status
 */
export function HydrationIndicator({ className }: { className?: string }) {
  const { isConnected, isHydrated, hasDigitalKey } = useWallet();

  return (
    <motion.div
      className={cn('flex items-center gap-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={isHydrated ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        {isHydrated ? (
          <Unlock className="h-4 w-4 text-primary" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </motion.div>
      <span className="text-xs text-muted-foreground">
        {!isConnected && 'Not connected'}
        {isConnected && !isHydrated && 'Verifying...'}
        {isHydrated && hasDigitalKey && 'Digital Key Active'}
        {isHydrated && !hasDigitalKey && 'Connected'}
      </span>
    </motion.div>
  );
}
