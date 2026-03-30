import { callProxy } from './client';
import type { ShippingAddress } from './types';

export const getClientDetails = async (clientId: string) => {
  return callProxy<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isKYCVerified: boolean;
    adminApproval: string;
    shipping?: ShippingAddress;
  }>('get-my-details', { clientId });
};

export const getDappClients = async (params?: {
  page?: number;
  take?: number;
  orderBy?: 'asc' | 'desc';
  search?: string;
  searchBy?: string;
  status?: string;
  kyc?: boolean;
  adminApproval?: string;
}) => {
  return callProxy<{
    clients: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isKYCVerified: boolean;
      adminApproval: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    take: number;
  }>('dapp-clients', params);
};

export const getDappClientDetails = async (clientId: string) => {
  return callProxy<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: object;
    isKYCVerified: boolean;
    adminApproval: string;
    createdAt: string;
    orders: Array<object>;
  }>('dapp-client-details', { clientId });
};

export const patchClient = async (clientId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  shipping?: ShippingAddress;
}) => {
  return callProxy<{ success: boolean; client: object }>('patch-client', { clientId, data });
};

export const deleteClient = async (clientId: string) => {
  return callProxy<{ success: boolean; message: string }>('delete-client', { clientId });
};

export const activateClient = async (clientId: string) => {
  return callProxy<{ success: boolean; message: string }>('activate-client', { clientId });
};

export const deactivateClient = async (clientId: string) => {
  return callProxy<{ success: boolean; message: string }>('deactivate-client', { clientId });
};

export const bulkDeleteClients = async (clientIds: string[]) => {
  return callProxy<{ success: boolean; deleted: number; failed: number }>('bulk-delete-clients', { clientIds });
};

export const syncClientStatus = async (clientId: string) => {
  return callProxy<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isKYCVerified: boolean;
    adminApproval: string;
    createdAt: string;
  }>('sync-client-status', { clientId });
};

/** @deprecated Client approval must be done in Dr. Green DApp admin portal */
export const verifyDappClient = async (clientId: string, verifyAction: 'verify' | 'reject') => {
  console.warn('[DEPRECATED] verifyDappClient: Client approval must be done in Dr. Green DApp admin portal');
  return callProxy<{ success: boolean; message: string }>('dapp-verify-client', { clientId, verifyAction });
};

export const reregisterClient = async (clientData: {
  email: string;
  firstName: string;
  lastName: string;
  countryCode?: string;
  phoneCode?: string;
  phoneCountryCode?: string;
  contactNumber?: string;
  shipping?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    postalCode?: string;
    landmark?: string;
  };
}) => {
  return callProxy<{
    success: boolean;
    clientId?: string;
    kycLink?: string;
    message?: string;
  }>('admin-reregister-client', clientData);
};

export const syncClientByEmail = async (email: string, localUserId?: string) => {
  return callProxy<{
    success: boolean;
    client?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isKYCVerified: boolean;
      adminApproval: string;
    };
    synced?: boolean;
    message?: string;
  }>('sync-client-by-email', { email, localUserId });
};

export const getClientsSummary = async () => {
  return callProxy<{
    summary: {
      PENDING: number;
      VERIFIED: number;
      REJECTED: number;
      totalCount: number;
    };
  }>('get-clients-summary');
};

export const updateShippingAddress = async (clientId: string, shipping: ShippingAddress) => {
  return callProxy<{ success: boolean; message?: string }>('update-shipping-address', { clientId, shipping });
};

export const adminUpdateShippingAddress = async (clientId: string, shipping: ShippingAddress) => {
  return callProxy<{ success: boolean; message?: string }>('admin-update-shipping-address', { clientId, shipping });
};
