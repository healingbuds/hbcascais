import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ResyncResult {
  success: boolean;
  newClientId?: string;
  kycLink?: string;
  error?: string;
}

/**
 * Hook for re-syncing a user's Dr. Green client record under current credentials.
 * 
 * This is needed when a client record was created under different API credentials
 * (different NFT scope) and cannot be used for orders with current credentials.
 * 
 * The process:
 * 1. Delete the old local drgreen_clients record
 * 2. Create a new client record via create-client-legacy action
 * 3. Store the new drgreen_client_id and kyc_link
 * 4. User completes KYC again via the new link
 */
export function useClientResync() {
  const { toast } = useToast();
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncError, setResyncError] = useState<string | null>(null);

  const resyncClient = useCallback(async (
    existingClientData: {
      id: string;
      email: string;
      fullName?: string;
      countryCode?: string;
      shippingAddress?: {
        address1?: string;
        address2?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };
    }
  ): Promise<ResyncResult> => {
    setIsResyncing(true);
    setResyncError(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Parse name into first/last
      const nameParts = (existingClientData.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || 'Patient';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Convert 2-letter country code to 3-letter ISO for API
      const countryCodeMap: Record<string, string> = {
        'ZA': 'ZAF', 'PT': 'PRT', 'GB': 'GBR', 'US': 'USA', 
        'TH': 'THA', 'DE': 'DEU', 'FR': 'FRA', 'ES': 'ESP'
      };
      const alpha2Code = existingClientData.countryCode || 'PT';
      const alpha3Code = countryCodeMap[alpha2Code] || alpha2Code;

      // Prepare the client creation payload - using 'payload' key as expected by proxy
      const clientPayload = {
        action: 'create-client-legacy',
        payload: {
          firstName,
          lastName,
          email: existingClientData.email,
          phoneCode: '+1',
          phoneCountryCode: alpha2Code,
          contactNumber: '0000000000',
          shipping: existingClientData.shippingAddress ? {
            address1: existingClientData.shippingAddress.address1 || 'Address pending',
            address2: existingClientData.shippingAddress.address2 || '',
            city: existingClientData.shippingAddress.city || 'City pending',
            state: existingClientData.shippingAddress.state || existingClientData.shippingAddress.city || 'State pending',
            country: existingClientData.shippingAddress.country || 'Portugal',
            countryCode: alpha3Code,
            postalCode: existingClientData.shippingAddress.postalCode || '0000',
          } : {
            address1: 'Address pending',
            city: 'City pending',
            state: 'State pending',
            country: 'Portugal',
            countryCode: alpha3Code,
            postalCode: '0000',
          },
          medicalRecord: {
            dob: '1990-01-01',
            gender: 'prefer_not_to_say',
            medicalConditions: ['other_medical_condition'],
            medicalHistory0: false,
            medicalHistory1: false,
            medicalHistory2: false,
            medicalHistory3: false,
            medicalHistory4: false,
            medicalHistory5: ['none'],
            medicalHistory8: false,
            medicalHistory9: false,
            medicalHistory10: false,
            medicalHistory12: false,
            medicalHistory13: 'never',
            medicalHistory14: ['never'],
          },
        },
      };

      // Call the proxy to create new client
      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('drgreen-proxy', {
        body: clientPayload,
      });

      if (proxyError) {
        throw new Error(proxyError.message || 'Failed to create new client record');
      }

      if (!proxyData?.success || !proxyData?.clientId) {
        throw new Error(proxyData?.message || 'Invalid response from client creation');
      }

      const newClientId = proxyData.clientId;
      const kycLink = proxyData.kycLink;

      // Delete old local record
      await supabase
        .from('drgreen_clients')
        .delete()
        .eq('id', existingClientData.id);

      // Insert new record
      const { error: insertError } = await supabase
        .from('drgreen_clients')
        .insert({
          user_id: user.id,
          drgreen_client_id: newClientId,
          email: existingClientData.email,
          full_name: existingClientData.fullName,
          country_code: existingClientData.countryCode || 'PT',
          is_kyc_verified: false,
          admin_approval: 'PENDING',
          kyc_link: kycLink,
        });

      if (insertError) {
        console.error('Failed to insert new client record:', insertError);
        // Don't throw - the Dr. Green record was created successfully
      }

      toast({
        title: 'Account Re-Linked',
        description: 'Your account has been re-synced. Please complete KYC verification again.',
      });

      return {
        success: true,
        newClientId,
        kycLink,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Re-sync failed';
      setResyncError(message);
      
      toast({
        title: 'Re-Sync Failed',
        description: message,
        variant: 'destructive',
      });

      return {
        success: false,
        error: message,
      };
    } finally {
      setIsResyncing(false);
    }
  }, [toast]);

  return {
    resyncClient,
    isResyncing,
    resyncError,
  };
}
