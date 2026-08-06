import { posCartStore } from '@/stores/usePosCart'

// Simple hook to use the POS cart store directly
export const usePosCart = () => {
  return posCartStore()
}
