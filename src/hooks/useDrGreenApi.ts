import { useMemo } from 'react';
import * as drgreen from '@/lib/drgreen';

/**
 * Thin wrapper that re-exports all Dr. Green API functions as a stable hook return value.
 * The actual logic lives in `src/lib/drgreen/` as plain TypeScript modules.
 *
 * Consumers can also import directly from `@/lib/drgreen` if they don't need the hook pattern.
 */
export function useDrGreenApi() {
  return useMemo(() => drgreen, []);
}
