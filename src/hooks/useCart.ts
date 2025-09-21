import { cartStore } from '@/stores/useCart'

// Simple hook to use the cart store directly
export const useCart = () => {
  return cartStore()
}