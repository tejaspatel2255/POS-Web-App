import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '../types/supabase'

type Product = Database['public']['Tables']['products']['Row']

export interface CartItem extends Product {
  cart_item_id: string
  quantity: number
  discount_percent: number
}

export interface HeldCart {
  id: string
  items: CartItem[]
  orderType: string
  discountPercent: number
  parcelCharges: number
  heldAt: string
}

interface CartStore {
  items: CartItem[]
  orderType: string
  discountPercent: number
  parcelCharges: number
  heldCarts: HeldCart[]
  addItem: (product: Product) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  updateItemDiscount: (cartItemId: string, discount: number) => void
  setOrderType: (type: string) => void
  setGlobalDiscount: (discount: number) => void
  setParcelCharges: (charges: number) => void
  clearCart: () => void
  holdCurrentCart: () => void
  resumeCart: (id: string) => void
  deleteHeldCart: (id: string) => void
  subtotal: () => number
  totalDiscount: () => number
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'dine_in',
      discountPercent: 0,
      parcelCharges: 0,
      heldCarts: [],
      
      addItem: (product) => set((state) => {
        const existingItem = state.items.find(i => i.id === product.id)
        if (existingItem) {
          return {
            items: state.items.map(i => 
              i.id === product.id 
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        return {
          items: [...state.items, { ...product, cart_item_id: crypto.randomUUID(), quantity: 1, discount_percent: 0 }]
        }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.cart_item_id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.cart_item_id === id 
            ? { ...i, quantity: Math.max(1, quantity) }
            : i
        )
      })),

      updateItemDiscount: (id, discount) => set((state) => ({
        items: state.items.map(i => 
          i.cart_item_id === id 
            ? { ...i, discount_percent: Math.max(0, Math.min(100, discount)) }
            : i
        )
      })),

      setOrderType: (type) => set({ orderType: type }),
      setGlobalDiscount: (discount) => set({ discountPercent: Math.max(0, Math.min(100, discount)) }),
      setParcelCharges: (charges) => set({ parcelCharges: Math.max(0, charges) }),
      
      clearCart: () => set({ items: [], discountPercent: 0, parcelCharges: 0 }),

      holdCurrentCart: () => set((state) => {
        if (state.items.length === 0) return {}
        const newHeldCart: HeldCart = {
          id: crypto.randomUUID(),
          items: state.items,
          orderType: state.orderType,
          discountPercent: state.discountPercent,
          parcelCharges: state.parcelCharges,
          heldAt: new Date().toISOString()
        }
        return {
          heldCarts: [...state.heldCarts, newHeldCart],
          items: [],
          discountPercent: 0,
          parcelCharges: 0
        }
      }),

      resumeCart: (id) => set((state) => {
        const cartToResume = state.heldCarts.find(c => c.id === id)
        if (!cartToResume) return {}
        return {
          items: cartToResume.items,
          orderType: cartToResume.orderType,
          discountPercent: cartToResume.discountPercent,
          parcelCharges: cartToResume.parcelCharges,
          heldCarts: state.heldCarts.filter(c => c.id !== id)
        }
      }),

      deleteHeldCart: (id) => set((state) => ({
        heldCarts: state.heldCarts.filter(c => c.id !== id)
      })),
      
      subtotal: () => {
        const items = get().items
        return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
      },
      
      totalDiscount: () => {
        const state = get()
        const itemDiscounts = state.items.reduce((sum, item) => {
          const itemTotal = (item.price || 0) * item.quantity
          return sum + (itemTotal * (item.discount_percent / 100))
        }, 0)
        
        const remainingSubtotal = state.subtotal() - itemDiscounts
        const globalDiscount = remainingSubtotal * (state.discountPercent / 100)
        
        return itemDiscounts + globalDiscount
      },
      
      total: () => {
        const state = get()
        return state.subtotal() - state.totalDiscount() + state.parcelCharges
      }
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)
