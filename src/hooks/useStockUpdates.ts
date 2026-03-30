import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface StockUpdate {
  strainId: string;
  stock: number;
  availability: boolean;
  countryCode?: string;
  event: string;
  timestamp: string;
}

interface UseStockUpdatesOptions {
  countryCode?: string;
  onStockChange?: (update: StockUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time stock updates via Supabase Realtime
 * Broadcasts are sent from drgreen-webhook when inventory changes occur
 */
export function useStockUpdates({
  countryCode,
  onStockChange,
  enabled = true,
}: UseStockUpdatesOptions = {}) {
  
  const handleStockChange = useCallback((payload: { payload: StockUpdate }) => {
    const update = payload.payload;
    
    // Filter by country code if specified
    if (countryCode && update.countryCode && update.countryCode !== countryCode) {
      return;
    }
    
    console.log('[Stock Update] Received:', update);
    onStockChange?.(update);
  }, [countryCode, onStockChange]);

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;

    const setupChannel = async () => {
      channel = supabase.channel('stock-updates');
      
      channel
        .on('broadcast', { event: 'stock-change' }, handleStockChange)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Stock Updates] Subscribed to real-time stock changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Stock Updates] Failed to subscribe to channel');
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        console.log('[Stock Updates] Unsubscribing from channel');
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, handleStockChange]);
}
