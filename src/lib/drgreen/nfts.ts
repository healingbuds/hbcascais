import { callProxy } from './client';
import type { PageMetaDto } from './types';

export const getUserMe = async () => {
  return callProxy<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    walletAddress?: string;
    nfts?: Array<{ id: string; tokenId: string; type: string }>;
  }>('get-user-me');
};

export const getUserNfts = async () => {
  return callProxy<{
    nfts: Array<{
      tokenId: number;
      nftMetadata: {
        nftName: string;
        nftType: string;
        imageUrl: string;
      };
      owner: {
        id: string;
        walletAddress: string;
        fullName: string;
        username: string;
        email: string;
        phoneCountryCode: string | null;
        phoneCode: string | null;
        phoneNumber: string | null;
        profileUrl: string;
        isActive: boolean;
      };
    }>;
    pageMetaDto: PageMetaDto;
  }>('get-user-nfts');
};
