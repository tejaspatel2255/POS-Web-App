// File Path: d:/Projects/Web/Universal POS/src/store/cartStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem } from '../types'

export interface HeldCart {
  id: string
  items: CartItem[]
  orderType: string
  discountPercent: number
  parcelCharges: number
  heldAt: string
}

interface StoreCart {
  items: CartItem[]
  discountPercent: number
  parcelCharges: number
  heldCarts: HeldCart[]
  orderType: string
}

interface CartStore {
  // Current active store cart state
  items: CartItem[]
  storeId: string | null
  discountPercent: number
  parcelCharges: number
  heldCarts: HeldCart[]
  orderType: string

  // All stores carts dictionary
  carts: { [storeId: string]: StoreCart }

  // Setters & Actions
  setStoreId: (storeId: string | null) => void
  addItem: (product: Product) => void
  removeItem: (cartItemId: string) => void
  updateQty: (cartItemId: string, quantity: number) => void
  updateQuantity: (cartItemId: string, quantity: number) => void // Alias for backward compatibility
  updateItemDiscount: (cartItemId: string, discount: number) => void
  setOrderType: (type: string) => void
  applyDiscount: (discount: number) => void
  setGlobalDiscount: (discount: number) => void // Alias for backward compatibility
  setParcelCharges: (charges: number) => void
  clearCart: () => void

  // Cart Hold System
  holdCurrentCart: () => void
  resumeCart: (id: string) => void
  deleteHeldCart: (id: string) => void

  // Calculation Selectors
  subtotal: () => number
  totalDiscount: () => number
  total: () => number
}

const initialStoreCart = (): StoreCart => ({
  items: [],
  discountPercent: 0,
  parcelCharges: 0,
  heldCarts: [],
  orderType: 'walk_in',
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      discountPercent: 0,
      parcelCharges: 0,
      heldCarts: [],
      orderType: 'walk_in',
      carts: {},

      setStoreId: (storeId) => set((state) => {
        // 1. Save current active cart state to the dictionary under old storeId
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            items: state.items,
            discountPercent: state.discountPercent,
            parcelCharges: state.parcelCharges,
            heldCarts: state.heldCarts,
            orderType: state.orderType,
          };
        }

        // 2. Load the cart state for the new storeId
        const targetCart = storeId && updatedCarts[storeId] ? updatedCarts[storeId] : initialStoreCart();

        return {
          storeId,
          items: targetCart.items,
          discountPercent: targetCart.discountPercent,
          parcelCharges: targetCart.parcelCharges,
          heldCarts: targetCart.heldCarts,
          orderType: targetCart.orderType,
          carts: updatedCarts,
        };
      }),

      addItem: (product) => set((state) => {
        const existingItem = state.items.find(i => i.id === product.id)
        let updatedItems: CartItem[];

        if (existingItem) {
          updatedItems = state.items.map(i =>
            i.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          updatedItems = [
            ...state.items,
            { ...product, cart_item_id: crypto.randomUUID(), quantity: 1, discount_percent: 0 }
          ];
        }

        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: updatedItems,
          };
        }

        return {
          items: updatedItems,
          carts: updatedCarts,
        };
      }),

      removeItem: (id) => set((state) => {
        const updatedItems = state.items.filter(i => i.cart_item_id !== id);
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: updatedItems,
          };
        }
        return {
          items: updatedItems,
          carts: updatedCarts,
        };
      }),

      updateQty: (id, quantity) => set((state) => {
        const updatedItems = state.items.map(i =>
          i.cart_item_id === id
            ? { ...i, quantity: Math.max(1, quantity) }
            : i
        );
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: updatedItems,
          };
        }
        return {
          items: updatedItems,
          carts: updatedCarts,
        };
      }),

      // Alias
      updateQuantity: (id, quantity) => get().updateQty(id, quantity),

      updateItemDiscount: (id, discount) => set((state) => {
        const updatedItems = state.items.map(i =>
          i.cart_item_id === id
            ? { ...i, discount_percent: Math.max(0, Math.min(100, discount)) }
            : i
        );
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: updatedItems,
          };
        }
        return {
          items: updatedItems,
          carts: updatedCarts,
        };
      }),

      setOrderType: (type) => set((state) => {
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            orderType: type,
          };
        }
        return {
          orderType: type,
          carts: updatedCarts,
        };
      }),

      applyDiscount: (discount) => set((state) => {
        const val = Math.max(0, Math.min(100, discount));
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            discountPercent: val,
          };
        }
        return {
          discountPercent: val,
          carts: updatedCarts,
        };
      }),

      // Alias
      setGlobalDiscount: (discount) => get().applyDiscount(discount),

      setParcelCharges: (charges) => set((state) => {
        const val = Math.max(0, charges);
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            parcelCharges: val,
          };
        }
        return {
          parcelCharges: val,
          carts: updatedCarts,
        };
      }),

      clearCart: () => set((state) => {
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: [],
            discountPercent: 0,
            parcelCharges: 0,
          };
        }
        return {
          items: [],
          discountPercent: 0,
          parcelCharges: 0,
          carts: updatedCarts,
        };
      }),

      holdCurrentCart: () => set((state) => {
        if (state.items.length === 0) return {};
        
        const newHeldCart: HeldCart = {
          id: crypto.randomUUID(),
          items: state.items,
          orderType: state.orderType,
          discountPercent: state.discountPercent,
          parcelCharges: state.parcelCharges,
          heldAt: new Date().toISOString()
        };

        const updatedHeldCarts = [...state.heldCarts, newHeldCart];
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: [],
            discountPercent: 0,
            parcelCharges: 0,
            heldCarts: updatedHeldCarts,
          };
        }

        return {
          heldCarts: updatedHeldCarts,
          items: [],
          discountPercent: 0,
          parcelCharges: 0,
          carts: updatedCarts,
        };
      }),

      resumeCart: (id) => set((state) => {
        const cartToResume = state.heldCarts.find(c => c.id === id);
        if (!cartToResume) return {};
        
        const updatedHeldCarts = state.heldCarts.filter(c => c.id !== id);
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            items: cartToResume.items,
            orderType: cartToResume.orderType,
            discountPercent: cartToResume.discountPercent,
            parcelCharges: cartToResume.parcelCharges,
            heldCarts: updatedHeldCarts,
          };
        }

        return {
          items: cartToResume.items,
          orderType: cartToResume.orderType,
          discountPercent: cartToResume.discountPercent,
          parcelCharges: cartToResume.parcelCharges,
          heldCarts: updatedHeldCarts,
          carts: updatedCarts,
        };
      }),

      deleteHeldCart: (id) => set((state) => {
        const updatedHeldCarts = state.heldCarts.filter(c => c.id !== id);
        const updatedCarts = { ...state.carts };
        if (state.storeId) {
          updatedCarts[state.storeId] = {
            ...initialStoreCart(),
            ...updatedCarts[state.storeId],
            heldCarts: updatedHeldCarts,
          };
        }
        return {
          heldCarts: updatedHeldCarts,
          carts: updatedCarts,
        };
      }),

      subtotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
      },

      totalDiscount: () => {
        const state = get();
        const itemDiscounts = state.items.reduce((sum, item) => {
          const itemTotal = (item.price || 0) * item.quantity;
          return sum + (itemTotal * (item.discount_percent / 100));
        }, 0);

        const remainingSubtotal = state.subtotal() - itemDiscounts;
        const globalDiscount = remainingSubtotal * (state.discountPercent / 100);

        return itemDiscounts + globalDiscount;
      },

      total: () => {
        const state = get();
        return state.subtotal() - state.totalDiscount() + state.parcelCharges;
      }
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)
