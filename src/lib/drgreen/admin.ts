import { callProxy } from './client';
import type { PageMetaDto } from './types';

export const getDashboardSummary = async () => {
  return callProxy<{
    totalClients: number;
    totalOrders: number;
    totalSales: number;
    pendingOrders: number;
    verifiedClients: number;
    pendingClients: number;
  }>('dashboard-summary');
};

export const getDashboardAnalytics = async (params?: {
  startDate?: string;
  endDate?: string;
  filterBy?: string;
  orderBy?: 'asc' | 'desc';
}) => {
  return callProxy<{
    salesData: Array<{ date: string; amount: number }>;
    ordersData: Array<{ date: string; count: number }>;
  }>('dashboard-analytics', params);
};

export const getSalesSummary = async () => {
  return callProxy<{
    totalSales: number;
    monthlySales: number;
    weeklySales: number;
    dailySales: number;
  }>('sales-summary');
};

export const getSalesSummaryNew = async () => {
  return callProxy<{
    summary: {
      ONGOING: number;
      LEADS: number;
      CLOSED: number;
      totalCount: number;
    };
    count: number;
  }>('get-sales-summary');
};

export const getSales = async (params?: {
  stage?: 'LEADS' | 'ONGOING' | 'CLOSED';
  page?: number;
  take?: number;
  orderBy?: 'asc' | 'desc';
  search?: string;
  searchBy?: string;
}) => {
  return callProxy<{
    sales: Array<{
      id: string;
      stage: string;
      description: string | null;
      orderId: string | null;
      client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneCountryCode: string;
        phoneCode: string;
        contactNumber: string;
        isActive: boolean;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    pageMetaDto: PageMetaDto;
  }>('get-sales', params);
};
