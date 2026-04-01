import { callProxy } from './client';
import type { PageMetaDto } from './types';

export const createOrder = async (orderData: {
  clientId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  shippingAddress?: {
    street?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
    landmark?: string;
  };
  notes?: string;
}) => {
  const result = await callProxy<Record<string, unknown>>('create-order', { data: orderData });
  if (result.error || !result.data) return result as { data: null; error: string };

  // Normalize: API returns { success, data: { id, orderStatus, ... } }
  const raw = result.data;
  const inner = (raw.data || raw) as Record<string, unknown>;
  const orderId = (inner.id || inner.orderId || raw.id || raw.orderId) as string;

  return {
    data: {
      orderId,
      status: (inner.orderStatus || inner.status || 'PENDING') as string,
      totalAmount: (inner.totalAmount || 0) as number,
    },
    error: null,
  };
};


export const getOrder = async (orderId: string) => {
  return callProxy<{
    orderId: string;
    status: string;
    items: Array<{ strainId: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    paymentStatus: string;
  }>('get-order', { orderId });
};

export const updateOrder = async (orderId: string, data: {
  status?: string;
  paymentStatus?: string;
}) => {
  return callProxy<{
    orderId: string;
    status: string;
    paymentStatus: string;
  }>('update-order', { orderId, data });
};

export const getOrders = async (clientId: string) => {
  return callProxy<Array<{
    orderId: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    paymentStatus: string;
  }>>('get-orders', { clientId });
};

export const getClientOrders = async (clientId: string, params?: {
  page?: number;
  take?: number;
  orderBy?: 'asc' | 'desc';
}) => {
  return callProxy<{
    orders: Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
      paymentStatus: string;
      orderStatus: string;
      invoiceNumber: string;
      totalAmount: number;
      totalOrdered: number;
      totalQuantity: number;
      totalPrice: number;
    }>;
    pageMetaDto: PageMetaDto;
  }>('get-client-orders', { clientId, ...params });
};

export const getDappOrders = async (params?: {
  page?: number;
  take?: number;
  orderBy?: 'asc' | 'desc';
  search?: string;
  searchBy?: string;
  adminApproval?: string;
  clientIds?: string[];
}) => {
  return callProxy<{
    orders: Array<{
      id: string;
      clientId: string;
      status: string;
      paymentStatus: string;
      totalAmount: number;
      createdAt: string;
      items: Array<object>;
    }>;
    total: number;
    page: number;
    take: number;
  }>('dapp-orders', params);
};

export const getDappOrderDetails = async (orderId: string) => {
  return callProxy<{
    id: string;
    clientId: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    items: Array<object>;
    shippingAddress: object;
    createdAt: string;
  }>('dapp-order-details', { orderId });
};

export const updateDappOrder = async (orderId: string, data: {
  orderStatus?: string;
  paymentStatus?: string;
}) => {
  return callProxy<{ success: boolean; message: string }>('dapp-update-order', { orderId, ...data });
};

export const placeOrder = async (orderData: { clientId: string }) => {
  return callProxy<{
    orderId: string;
    status: string;
    totalAmount: number;
  }>('place-order', { data: orderData });
};
