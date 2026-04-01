import { ReactNode, Suspense, lazy, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const WalletProviderLazy = lazy(() =>
  import('./WalletProvider').then((m) => ({ default: m.WalletProvider }))
);
const WalletContextProviderLazy = lazy(() =>
  import('@/context/WalletContext').then((m) => ({ default: m.WalletContextProvider }))
);

/**
 * Only mounts WalletProvider (wagmi/RainbowKit) + WalletContextProvider
 * when the current route needs wallet functionality (admin routes).
 * This prevents WalletConnect/Reown from initializing on every page load,
 * eliminating 403 / allowlist console noise in non-admin contexts.
 */
export function LazyWalletBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const needsWallet = useMemo(
    () => location.pathname.startsWith('/admin'),
    [location.pathname]
  );

  if (!needsWallet) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <WalletProviderLazy>
        <WalletContextProviderLazy>{children}</WalletContextProviderLazy>
      </WalletProviderLazy>
    </Suspense>
  );
}
