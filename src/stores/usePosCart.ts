/* eslint-disable no-unused-vars */
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { IProduct, IProductCart } from '@/interfaces/product'

export interface IHeldOrder {
  id: string
  label: string
  items: IProductCart[]
  totalPrice: number
  createdAt: string
}

export interface PosCartState {
  products: IProductCart[]
  heldOrders: IHeldOrder[]
}

export interface PosCartActions {
  addProduct: (product: IProduct | IProductCart) => void
  removeProduct: (productId: string) => void
  reduceQuantity: (productId: string) => void
  updateProductQuantity: (productId: string, num: number) => void
  clearCart: () => void
  getProducts: () => IProductCart[]
  getTotalPrice: () => number
  getTotalItems: () => number
  getTotalQuantity: (productId?: string) => number
  holdOrder: (label: string) => void
  resumeHeldOrder: (heldOrderId: string) => void
  deleteHeldOrder: (heldOrderId: string) => void
}

export const posCartStore = create<PosCartState & PosCartActions>()(
  persist(
    (set, get) => ({
      products: [],
      heldOrders: [],

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

      reduceQuantity: (productId) => set((state) => ({
        products: state.products
          .map(p =>
            p.id === productId && p.quantity > 0
              ? { ...p, quantity: p.quantity - 1 }
              : p
          )
          .filter(p => p.quantity > 0)
      })),

      updateProductQuantity: (productId, num) => set((state) => ({
        products: num <= 0
          ? state.products.filter(p => p.id !== productId)
          : state.products.map(p =>
              p.id === productId ? { ...p, quantity: num } : p
            )
      })),

      clearCart: () => set({ products: [] }),

      getProducts: () => get().products,

      getTotalPrice: () => get().products.reduce(
        (acc, p) => acc + p.price * p.quantity, 0
      ),

      getTotalItems: () => get().products.length,

      getTotalQuantity: (productId) => {
        const products = productId
          ? get().products.filter(p => p.id === productId)
          : get().products
        return products.reduce((acc, p) => acc + p.quantity, 0)
      },

      holdOrder: (label) => set((state) => {
        if (!state.products.length) return state
        const held: IHeldOrder = {
          id: uuidv4(),
          label,
          items: state.products,
          totalPrice: state.products.reduce(
            (acc, p) => acc + p.price * p.quantity, 0
          ),
          createdAt: new Date().toISOString()
        }
        return { products: [], heldOrders: [...state.heldOrders, held] }
      }),

      resumeHeldOrder: (heldOrderId) => set((state) => {
        const held = state.heldOrders.find(h => h.id === heldOrderId)
        if (!held) return state
        return {
          products: held.items,
          heldOrders: state.heldOrders.filter(h => h.id !== heldOrderId)
        }
      }),

      deleteHeldOrder: (heldOrderId) => set((state) => ({
        heldOrders: state.heldOrders.filter(h => h.id !== heldOrderId)
      }))
    }),
    {
      name: 'pos-cart-bafkitchen'
    }
  )
)
