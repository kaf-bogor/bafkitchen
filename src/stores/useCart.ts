/* eslint-disable no-unused-vars */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { IProduct, IProductCart } from '@/interfaces/product'

export interface CartState {
  products: IProductCart[]
}

export interface CartActions {
  addProduct: (product: IProduct | IProductCart) => void
  removeProduct: (productId: string) => void
  reduceQuantity: (productId: string) => void
  getTotalQuantity: (productId?: string) => number
  clearCart: () => void
  getProducts: () => IProductCart[]
  getTotalPrice: () => number
  updateProductQuantity: (productId: string, num: number) => void
}

export const cartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => set((state) => {
        const existingProduct = state.products.find(p => p.id === product.id)
        if (existingProduct) {
          return {
            products: state.products.map(p => 
              p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
            )
          }
        }
        const newProduct = 'quantity' in product 
          ? product as IProductCart
          : { ...product as IProduct, quantity: 1 }
        return { products: [...state.products, newProduct] }
      }),

      removeProduct: (productId) => set((state) => ({
        products: state.products.filter(p => p.id !== productId)
      })),

      getTotalQuantity: (productId) => {
        const products = productId 
          ? get().products.filter(p => p.id === productId)
          : get().products
        return products.reduce((acc, p) => acc + p.quantity, 0)
      },

      reduceQuantity: (productId) => set((state) => ({
        products: state.products.map(p => 
          p.id === productId && p.quantity > 0 
            ? { ...p, quantity: p.quantity - 1 } 
            : p
        )
      })),

      clearCart: () => set({ products: [] }),

      getProducts: () => get().products,

      getTotalPrice: () => get().products.reduce(
        (acc, p) => acc + p.price * p.quantity, 0
      ),

      updateProductQuantity: (productId, num) => set((state) => ({
        products: state.products.map(p => 
          p.id === productId ? { ...p, quantity: num } : p
        )
      }))
    }),
    {
      name: 'cart-bafkitchen'
    }
  )
)
