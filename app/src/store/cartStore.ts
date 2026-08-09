// ============================================================
// Veterinaria La Plata — Cart Store (Zustand with persist)
// ============================================================
import { create } from 'zustand';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  setCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  couponCode: null,
  couponDiscount: 0,

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

  clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),

  setCoupon: (code, discount) =>
    set({ couponCode: code, couponDiscount: discount }),

  removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

  getItemCount: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),

  getSubtotal: () =>
    get().items.reduce((total, item) => total + item.price * item.quantity, 0),

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().couponDiscount;
    return Math.max(0, subtotal - discount);
  },
}));
