// src/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '../types'

export interface CartData {
  items: CartItem[]
  discountPercent: number
  parcelCharges: number
  orderType: 'walk_in' | 'dine_in' | 'takeaway' | 'parcel' | 'delivery'
  paymentMethod: 'cash' | 'card' | 'upi' | 'other'
  note: string
}

interface CartState {
  carts: Record<string, CartData>
  addItem: (storeId: string, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (storeId: string, productId: string) => void
  updateQty: (storeId: string, productId: string, quantity: number) => void
  clearCart: (storeId: string) => void
  setDiscount: (storeId: string, discount: number) => void
  setParcelCharges: (storeId: string, charges: number) => void
  setOrderType: (storeId: string, orderType: CartData['orderType']) => void
  setPaymentMethod: (storeId: string, paymentMethod: CartState['carts'][string]['paymentMethod']) => void
  setNote: (storeId: string, note: string) => void
}

const defaultCart = (): CartData => ({
  items: [],
  discountPercent: 0,
  parcelCharges: 0,
  orderType: 'walk_in',
  paymentMethod: 'cash',
  note: ''
})

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},

      addItem: (storeId, item) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        const existingItemIndex = cart.items.findIndex((i) => i.product_id === item.product_id)
        
        let newItems = [...cart.items]
        if (existingItemIndex > -1) {
          const qty = newItems[existingItemIndex].quantity + (item.quantity ?? 1)
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: qty > 0 ? qty : 1
          }
        } else {
          newItems.push({
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity ?? 1,
            unit: item.unit,
            discount_percent: item.discount_percent ?? 0,
            image_url: item.image_url
          })
        }

        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, items: newItems }
          }
        }
      }),

      removeItem: (storeId, productId) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: {
              ...cart,
              items: cart.items.filter((item) => item.product_id !== productId)
            }
          }
        }
      }),

      updateQty: (storeId, productId, quantity) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        const newItems = cart.items.map((item) => {
          if (item.product_id === productId) {
            return { ...item, quantity: quantity > 0 ? quantity : 1 }
          }
          return item
        })
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, items: newItems }
          }
        }
      }),

      clearCart: (storeId) => set((state) => ({
        carts: {
          ...state.carts,
          [storeId]: defaultCart()
        }
      })),

      setDiscount: (storeId, discountPercent) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, discountPercent: Math.max(0, Math.min(100, discountPercent)) }
          }
        }
      }),

      setParcelCharges: (storeId, parcelCharges) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, parcelCharges: Math.max(0, parcelCharges) }
          }
        }
      }),

      setOrderType: (storeId, orderType) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, orderType }
          }
        }
      }),

      setPaymentMethod: (storeId, paymentMethod) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, paymentMethod }
          }
        }
      }),

      setNote: (storeId, note) => set((state) => {
        const cart = state.carts[storeId] || defaultCart()
        return {
          carts: {
            ...state.carts,
            [storeId]: { ...cart, note }
          }
        }
      })
    }),
    {
      name: 'pos-carts'
    }
  )
)

// React Hook to access cart state for a specific storeId
export function useCart(storeId: string) {
  const state = useCartStore()
  const cart = state.carts[storeId] || defaultCart()

  const subtotal = cart.items.reduce((sum, item) => {
    const itemDiscount = (item.price * (item.discount_percent / 100))
    return sum + ((item.price - itemDiscount) * item.quantity)
  }, 0)
  
  const discountAmount = Number((subtotal * (cart.discountPercent / 100)).toFixed(2))
  const total = Number((subtotal - discountAmount + cart.parcelCharges).toFixed(2))

  return {
    items: cart.items,
    discountPercent: cart.discountPercent,
    parcelCharges: cart.parcelCharges,
    orderType: cart.orderType,
    paymentMethod: cart.paymentMethod,
    note: cart.note,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount,
    total,
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => state.addItem(storeId, item),
    removeItem: (productId: string) => state.removeItem(storeId, productId),
    updateQty: (productId: string, qty: number) => state.updateQty(storeId, productId, qty),
    clearCart: () => state.clearCart(storeId),
    setDiscount: (discount: number) => state.setDiscount(storeId, discount),
    setParcelCharges: (charges: number) => state.setParcelCharges(storeId, charges),
    setOrderType: (type: CartData['orderType']) => state.setOrderType(storeId, type),
    setPaymentMethod: (method: CartData['paymentMethod']) => state.setPaymentMethod(storeId, method),
    setNote: (note: string) => state.setNote(storeId, note)
  }
}
