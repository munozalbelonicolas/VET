// ============================================================
// Veterinaria La Plata — Cart Store (Zustand with persist)
// Descuento de cupón calculado en vivo desde el subtotal actual
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types';

export interface CouponMeta {
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponMeta: CouponMeta | null;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  setCoupon: (code: string, meta: CouponMeta) => void;
  removeCoupon: () => void;

  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

const computeDiscount = (subtotal: number, meta: CouponMeta | null): number => {
  if (!meta) return 0;
  if (meta.minPurchase && subtotal < meta.minPurchase) return 0;
  if (meta.discountType === 'percentage') {
    return Math.round(subtotal * (meta.discountValue / 100));
  }
  return Math.min(meta.discountValue, subtotal);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponMeta: null,

      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId
          );

          if (existingIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === (variantId ?? item.variantId))
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) =>
                  !(item.productId === productId && item.variantId === (variantId ?? item.variantId))
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId &&
              item.variantId === (variantId ?? item.variantId)
                ? { ...item, quantity }
                : item
            ),
          };
        }),

      clearCart: () => set({ items: [], couponCode: null, couponMeta: null }),

      setCoupon: (code, meta) => set({ couponCode: code, couponMeta: meta }),

      removeCoupon: () => set({ couponCode: null, couponMeta: null }),

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      getDiscount: () => computeDiscount(get().getSubtotal(), get().couponMeta),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = computeDiscount(subtotal, get().couponMeta);
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'vet-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
