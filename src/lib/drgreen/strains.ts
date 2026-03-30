import { callProxy, countryCodeMap } from './client';

export const getStrains = async (countryCode: string) => {
  const alpha3Code = countryCodeMap[countryCode] || countryCode;
  return callProxy<Array<{
    id: string;
    name: string;
    description: string;
    thcContent: number;
    cbdContent: number;
    retailPrice: number;
    availability: boolean;
    images: string[];
  }>>('get-strains', { countryCode: alpha3Code });
};

export const getDappStrains = async (params?: {
  countryCode?: string;
  orderBy?: 'asc' | 'desc';
  search?: string;
  searchBy?: string;
}) => {
  return callProxy<{
    strains: Array<{
      id: string;
      name: string;
      thcContent: number;
      cbdContent: number;
      retailPrice: number;
      availability: boolean;
    }>;
  }>('dapp-strains', params);
};
