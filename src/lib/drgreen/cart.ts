import { callProxy } from './client';

export const addToCart = async (cartData: {
  clientId: string;
  strainId: string;
  quantity: number;
}) => {
  return callProxy<{
    success: boolean;
    cart?: { items: Array<{ strainId: string; quantity: number }> };
  }>('add-to-cart', { data: cartData });
};

export const emptyCart = async (cartId: string) => {
  return callProxy<{ success: boolean }>('empty-cart', { cartId });
};
