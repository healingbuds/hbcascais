export interface DrGreenResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface PageMetaDto {
  page: string;
  take: string;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ShippingAddress {
  address1: string;
  address2?: string;
  landmark?: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  postalCode: string;
}
