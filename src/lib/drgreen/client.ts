import { supabase } from '@/integrations/supabase/client';
import type { DrGreenResponse } from './types';

/** Alpha-2 → Alpha-3 country code mapping */
export const countryCodeMap: Record<string, string> = {
  PT: 'PRT',
  GB: 'GBR',
  ZA: 'ZAF',
  TH: 'THA',
  US: 'USA',
};

/** Storage key for persisted environment selection */
const ENV_STORAGE_KEY = 'hb-api-environment';

/** Get current environment from localStorage */
export function getCurrentEnvironment(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    if (stored && ['production', 'staging', 'railway'].includes(stored)) {
      return stored;
    }
  }
  return 'production';
}

/** Core proxy caller — every domain function delegates to this */
export async function callProxy<T = unknown>(
  action: string,
  data?: Record<string, unknown>,
  overrideEnv?: string
): Promise<DrGreenResponse<T>> {
  try {
    const env = overrideEnv || getCurrentEnvironment();

    const { data: response, error } = await supabase.functions.invoke('drgreen-proxy', {
      body: { action, env, ...data },
    });

    if (error) {
      console.error('Dr Green API error:', error);
      return { data: null, error: error.message };
    }

    // Handle 200-wrapped error responses
    if (response && typeof response === 'object' && response.success === false) {
      const apiStatus = response.apiStatus || response.status;
      const errorMessage = response.message || response.error || 'Operation failed';
      const errorCode = response.errorCode || 'UNKNOWN';
      const requestId = response.requestId || '';

      const fullError = requestId
        ? `${errorMessage} [${errorCode}] (Status ${apiStatus}, Ref: ${requestId})`
        : `${errorMessage} (Status ${apiStatus})`;

      console.error('Dr Green API returned error:', {
        action,
        env,
        apiStatus,
        errorCode,
        message: errorMessage,
        requestId,
        retryable: response.retryable,
        stepFailed: response.stepFailed,
      });

      return { data: null, error: fullError };
    }

    return { data: response as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Dr Green API exception:', err);
    return { data: null, error: message };
  }
}
