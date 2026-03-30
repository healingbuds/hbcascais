import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDrGreenApi } from './useDrGreenApi';
import { useToast } from './use-toast';

interface DrGreenClient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isKYCVerified: boolean;
  adminApproval: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phoneCode?: string;
  phoneCountryCode?: string;
  contactNumber?: string;
  shippings?: Array<{ country: string; currency: string }>;
  nft?: { ownerId: string; tokenId: number };
}

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

interface ClientSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  kycVerified: number;
}

export function useDrGreenClientSync() {
  const { getDappClients, getClientsSummary } = useDrGreenApi();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [clients, setClients] = useState<DrGreenClient[]>([]);
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clients from Dr. Green API
  const fetchClients = useCallback(async (page = 1, take = 50) => {
    setError(null);
    
    try {
      const { data, error: apiError } = await getDappClients({ page, take, orderBy: 'desc' });
      
      if (apiError) {
        setError(apiError);
        return { clients: [], total: 0 };
      }

      if (data?.clients) {
        setClients(data.clients as unknown as DrGreenClient[]);
        return { clients: data.clients as unknown as DrGreenClient[], total: data.total || 0 };
      }

      return { clients: [], total: 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch clients';
      setError(message);
      return { clients: [], total: 0 };
    }
  }, [getDappClients]);

  // Fetch client summary (PENDING/VERIFIED/REJECTED counts)
  const fetchSummary = useCallback(async () => {
    try {
      const { data, error: apiError } = await getClientsSummary();
      
      if (apiError) {
        console.error('Failed to fetch summary:', apiError);
        return null;
      }

      if (data?.summary) {
        const summaryData: ClientSummary = {
          total: data.summary.totalCount || 0,
          verified: data.summary.VERIFIED || 0,
          pending: data.summary.PENDING || 0,
          rejected: data.summary.REJECTED || 0,
          kycVerified: data.summary.VERIFIED || 0, // KYC verified = admin verified
        };
        setSummary(summaryData);
        return summaryData;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      return null;
    }
  }, [getClientsSummary]);

  // Sync Dr. Green clients to local Supabase table
  const syncClientsToSupabase = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);
    
    const result: SyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    try {
      // Fetch all clients from Dr. Green (paginate if needed)
      let allClients: DrGreenClient[] = [];
      let page = 1;
      const take = 50;
      let hasMore = true;

      while (hasMore) {
        const { clients: pageClients, total } = await fetchClients(page, take);
        allClients = [...allClients, ...pageClients];
        hasMore = allClients.length < total;
        page++;
        
        // Safety limit
        if (page > 20) break;
      }

      // For each Dr. Green client, upsert to Supabase
      for (const client of allClients) {
        try {
          // Check if client exists by drgreen_client_id
          const { data: existing } = await supabase
            .from('drgreen_clients')
            .select('id, is_kyc_verified, admin_approval')
            .eq('drgreen_client_id', client.id)
            .maybeSingle();

          const countryCode = client.shippings?.[0]?.country || 
                              client.phoneCountryCode || 
                              'PT';

          if (existing) {
            // Update existing record if status changed
            if (
              existing.is_kyc_verified !== client.isKYCVerified ||
              existing.admin_approval !== client.adminApproval
            ) {
              const { error: updateError } = await supabase
                .from('drgreen_clients')
                .update({
                  is_kyc_verified: client.isKYCVerified,
                  admin_approval: client.adminApproval,
                  email: client.email,
                  full_name: `${client.firstName} ${client.lastName}`.trim(),
                  country_code: countryCode,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

              if (updateError) {
                result.errors.push(`Update ${client.email}: ${updateError.message}`);
              } else {
                result.updated++;
              }
            }
            result.synced++;
          } else {
            // We can't create records without a user_id, so log these as "external clients"
            // They'll be linked when the user signs up with matching email
            console.log(`External client (no Supabase user): ${client.email}`);
            result.synced++;
          }
        } catch (clientErr) {
          result.errors.push(`Client ${client.id}: ${clientErr instanceof Error ? clientErr.message : 'Unknown error'}`);
        }
      }

      setClients(allClients);
      setLastSyncAt(new Date());

      toast({
        title: 'Sync Complete',
        description: `${result.synced} clients synced. ${result.updated} updated.`,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      result.errors.push(message);
      
      toast({
        title: 'Sync Failed',
        description: message,
        variant: 'destructive',
      });

      return result;
    } finally {
      setSyncing(false);
    }
  }, [fetchClients, toast]);

  // Check if a specific client is verified and approved on Dr. Green
  const checkClientStatus = useCallback(async (email: string): Promise<{
    exists: boolean;
    isKYCVerified: boolean;
    adminApproval: string;
    drGreenClientId: string | null;
  }> => {
    try {
      const { data, error: apiError } = await getDappClients({ 
        search: email, 
        searchBy: 'email',
        take: 1 
      });
      
      if (apiError || !data?.clients?.length) {
        return { exists: false, isKYCVerified: false, adminApproval: 'PENDING', drGreenClientId: null };
      }

      const client = data.clients[0] as unknown as DrGreenClient;
      return {
        exists: true,
        isKYCVerified: client.isKYCVerified,
        adminApproval: client.adminApproval,
        drGreenClientId: client.id,
      };
    } catch {
      return { exists: false, isKYCVerified: false, adminApproval: 'PENDING', drGreenClientId: null };
    }
  }, [getDappClients]);

  // Link a Supabase user to their Dr. Green client record by email
  const linkUserToClient = useCallback(async (userId: string, email: string): Promise<boolean> => {
    try {
      const status = await checkClientStatus(email);
      
      if (!status.exists || !status.drGreenClientId) {
        console.log(`No Dr. Green client found for email: ${email}`);
        return false;
      }

      // Check if already linked
      const { data: existing } = await supabase
        .from('drgreen_clients')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('drgreen_clients')
          .update({
            drgreen_client_id: status.drGreenClientId,
            is_kyc_verified: status.isKYCVerified,
            admin_approval: status.adminApproval,
            email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        return !error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('drgreen_clients')
          .insert({
            user_id: userId,
            drgreen_client_id: status.drGreenClientId,
            is_kyc_verified: status.isKYCVerified,
            admin_approval: status.adminApproval,
            email,
            country_code: 'PT', // Default, will be updated on sync
          });

        return !error;
      }
    } catch (err) {
      console.error('Failed to link user:', err);
      return false;
    }
  }, [checkClientStatus]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchClients(),
      fetchSummary(),
    ]);
  }, [fetchClients, fetchSummary]);

  return {
    // State
    clients,
    summary,
    syncing,
    error,
    lastSyncAt,
    
    // Actions
    fetchClients,
    fetchSummary,
    syncClientsToSupabase,
    checkClientStatus,
    linkUserToClient,
    refresh,
  };
}
