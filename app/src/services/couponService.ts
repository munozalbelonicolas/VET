// ============================================================
// Veterinaria La Plata — Coupon Service
// CRUD de cupones, validación y aplicación con control de uso
// ============================================================
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db, DEMO_MODE } from '../config/firebase';
import { Coupon } from '../types';

const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

const mapCoupon = (id: string, data: any): Coupon => ({
  id,
  ...data,
  validFrom: toDate(data?.validFrom),
  validTo: toDate(data?.validTo),
});

const normalizeCode = (code: string): string => code.trim().toUpperCase().replace(/\s+/g, '');

// --- CRUD ---
export async function getCoupons(): Promise<Coupon[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'coupons'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => mapCoupon(d.id, d.data()));
  } catch (error) {
    console.log('getCoupons error:', error);
    if (DEMO_MODE) return [];
    throw error;
  }
}

export async function createCoupon(
  data: Omit<Coupon, 'id' | 'usedCount' | 'active'> & { active?: boolean }
): Promise<Coupon> {
  const payload = {
    ...data,
    code: normalizeCode(data.code),
    usedCount: 0,
    active: data.active ?? true,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'coupons'), payload);
  return {
    id: docRef.id,
    ...data,
    code: payload.code,
    usedCount: 0,
    active: payload.active,
  };
}

export async function updateCoupon(couponId: string, data: Partial<Coupon>): Promise<void> {
  const payload: Record<string, any> = { ...data };
  if (payload.code) payload.code = normalizeCode(payload.code);
  delete payload.id;
  await updateDoc(doc(db, 'coupons', couponId), payload);
}

export async function deleteCoupon(couponId: string): Promise<void> {
  await deleteDoc(doc(db, 'coupons', couponId));
}

// --- Validación y aplicación ---
export interface CouponResult {
  valid: boolean;
  coupon?: Coupon;
  message: string;
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const q = query(collection(db, 'coupons'), where('code', '==', normalized), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapCoupon(snapshot.docs[0].id, snapshot.docs[0].data());
}

export async function validateCoupon(code: string): Promise<CouponResult> {
  const coupon = await findCouponByCode(code);
  const now = new Date();

  if (!coupon) {
    return { valid: false, message: 'El código de descuento no es válido.' };
  }
  if (!coupon.active) {
    return { valid: false, coupon, message: 'Este descuento ya no está disponible.' };
  }
  if (now < coupon.validFrom) {
    return { valid: false, coupon, message: 'Este descuento aún no está vigente.' };
  }
  if (now > coupon.validTo) {
    return { valid: false, coupon, message: 'Este descuento ya venció.' };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, coupon, message: 'Este descuento alcanzó su límite de usos.' };
  }
  return { valid: true, coupon, message: `¡Descuento aplicado: ${formatDiscount(coupon)}!` };
}

export function discountFor(coupon: Coupon, subtotal: number): number {
  if (coupon.minPurchase && subtotal < coupon.minPurchase) return 0;
  if (coupon.discountType === 'percentage') {
    return Math.round(subtotal * (coupon.discountValue / 100));
  }
  return Math.min(coupon.discountValue, subtotal);
}

export const formatDiscount = (coupon: Coupon): string =>
  coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`;

export async function applyCoupon(code: string): Promise<CouponResult> {
  const result = await validateCoupon(code);
  if (!result.valid || !result.coupon) return result;

  try {
    await updateDoc(doc(db, 'coupons', result.coupon.id), {
      usedCount: increment(1),
    });
    return { ...result, coupon: { ...result.coupon, usedCount: result.coupon.usedCount + 1 } };
  } catch (error) {
    console.log('applyCoupon error:', error);
    return { valid: false, message: 'No se pudo aplicar el descuento. Intentá de nuevo.' };
  }
}

// Utilidades para generar códigos
export const generateCouponCode = (prefix = 'VET'): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${code}`;
};
