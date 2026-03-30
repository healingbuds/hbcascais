/**
 * useWalletAuth Hook
 * 
 * Implements nonce-based Sign-In with Ethereum (SIWE) for admin wallet authentication.
 * Flow:
 * 1. User connects MetaMask wallet
 * 2. Request a server-issued nonce from the edge function
 * 3. Build and sign a message containing the nonce
 * 4. Edge function verifies signature + nonce + NFT ownership
 * 5. Returns OTP token → frontend establishes Supabase session
 */

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletAuthState {
  isAuthenticating: boolean;
  error: string | null;
}

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const [state, setState] = useState<WalletAuthState>({
    isAuthenticating: false,
    error: null,
  });

  /**
   * Build the nonce-based authentication message.
   */
  const buildAuthMessage = useCallback((walletAddress: string, nonce: string, issuedAt: string): string => {
    return [
      'Healing Buds Admin Authentication',
      '',
      'I am signing in to the Healing Buds admin portal.',
      '',
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join('\n');
  }, []);

  /**
   * Request a server-issued nonce for wallet authentication.
   */
  const requestNonce = useCallback(async (walletAddress: string, purpose: string = 'login') => {
    const { data, error } = await supabase.functions.invoke('wallet-auth', {
      body: { action: 'request-nonce', address: walletAddress, purpose },
    });

    if (error || !data?.nonce) {
      throw new Error(data?.error || error?.message || 'Failed to request nonce');
    }

    return data as { address: string; nonce: string; purpose: string; issuedAt: string; expiresAt: string };
  }, []);

  /**
   * Initiate wallet-based authentication.
   * Two-step: request nonce → sign → verify.
   */
  const authenticateWithWallet = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setState({ isAuthenticating: false, error: 'Please connect your wallet first.' });
      return false;
    }

    setState({ isAuthenticating: true, error: null });

    try {
      // 1. Request nonce from server
      console.log('[useWalletAuth] Requesting nonce...');
      const nonceData = await requestNonce(address, 'login');
      console.log('[useWalletAuth] Nonce received:', nonceData.nonce.slice(0, 8) + '...');

      // 2. Build message with server nonce
      const message = buildAuthMessage(address, nonceData.nonce, nonceData.issuedAt);

      // 3. Request signature from wallet
      let signature: string;
      try {
        signature = await signMessageAsync({ message, account: address });
      } catch (signError: any) {
        if (signError?.code === 4001 || signError?.message?.includes('rejected')) {
          setState({ isAuthenticating: false, error: null });
          return false;
        }
        throw signError;
      }

      // 4. Verify with edge function (nonce-based)
      const { data, error: fnError } = await supabase.functions.invoke('wallet-auth', {
        body: { action: 'verify', message, signature, address, purpose: 'login' },
      });

      if (fnError) {
        const errorMsg = fnError.message || 'Authentication failed';
        setState({ isAuthenticating: false, error: errorMsg });
        toast({
          title: 'Authentication Failed',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      }

      if (!data?.success) {
        const errorMsg = data?.error || data?.detail || 'Wallet not authorized';
        setState({ isAuthenticating: false, error: errorMsg });
        toast({
          title: 'Access Denied',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      }

      // 5. Use OTP to establish Supabase session
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'email',
      });

      if (otpError) {
        console.error('[useWalletAuth] OTP verification failed:', otpError);
        setState({ isAuthenticating: false, error: 'Session creation failed. Please try again.' });
        toast({
          title: 'Session Error',
          description: 'Could not establish session. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // 6. Success!
      setState({ isAuthenticating: false, error: null });
      toast({
        title: 'Welcome, Admin',
        description: `Signed in with wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      return true;

    } catch (err: any) {
      console.error('[useWalletAuth] Unexpected error:', err);
      const errorMsg = err?.message || 'An unexpected error occurred';
      setState({ isAuthenticating: false, error: errorMsg });
      toast({
        title: 'Authentication Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }
  }, [address, isConnected, signMessageAsync, buildAuthMessage, requestNonce, toast]);

  return {
    authenticateWithWallet,
    isAuthenticating: state.isAuthenticating,
    error: state.error,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
