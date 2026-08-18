// ============================================================
// Veterinaria La Plata — Products & E-commerce Service
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
  serverTimestamp,
} from 'firebase/firestore';
import { db, DEMO_MODE } from '../config/firebase';
import { Product, Order, ShippingStatus, OrderItem } from '../types';

// --- MOCK DATA (solo DEMO_MODE) ---
let MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Royal Canin Medium Adult 15kg',
    description: 'Alimento balanceado completo para perros adultos de raza mediana.',
    category: 'food',
    species: 'dog',
    brand: 'Royal Canin',
    price: 68500,
    salePrice: 59900,
    variants: [],
    stock: 25,
    images: [],
    rating: 4.9,
    reviewCount: 42,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-2',
    name: 'Pro Plan Cat Sterilized 3kg',
    description: 'Alimento completo para gatos adultos castrados. Control de peso.',
    category: 'food',
    species: 'cat',
    brand: 'Purina Pro Plan',
    price: 32000,
    salePrice: 28500,
    variants: [],
    stock: 18,
    images: [],
    rating: 4.8,
    reviewCount: 29,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_ORDERS: Order[] = [];

// --- Helpers ---
const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

const mapProduct = (id: string, data: any): Product => ({
  id,
  ...data,
  createdAt: toDate(data?.createdAt),
  updatedAt: toDate(data?.updatedAt),
});

const mapOrder = (id: string, data: any): Order => ({
  id,
  ...data,
  createdAt: toDate(data?.createdAt),
  updatedAt: toDate(data?.updatedAt),
  trackingUpdates: (data?.trackingUpdates || []).map((u: any) => ({
    ...u,
    timestamp: toDate(u?.timestamp),
  })),
});

// --- PRODUCTS API ---
export async function getProducts(category?: string, species?: string): Promise<Product[]> {
  try {
    const baseQuery =
      category && category !== 'all'
        ? query(collection(db, 'products'), where('category', '==', category), where('active', '==', true))
        : query(collection(db, 'products'), where('active', '==', true));

    const querySnapshot = await getDocs(baseQuery);
    let products = querySnapshot.docs.map((d) => mapProduct(d.id, d.data()));

    if (species && species !== 'all') {
      products = products.filter((p) => p.species === species || p.species === 'both');
    }
    return products;
  } catch (error) {
    console.log('getProducts error:', error);
    if (!DEMO_MODE) throw error;
    let filtered = MOCK_PRODUCTS;
    if (category && category !== 'all') filtered = filtered.filter((p) => p.category === category);
    if (species && species !== 'all') {
      filtered = filtered.filter((p) => p.species === species || p.species === 'both');
    }
    return filtered;
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, 'products', productId));
  if (!snapshot.exists()) return null;
  return mapProduct(snapshot.id, snapshot.data());
}

export async function addProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>
): Promise<Product> {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...product, rating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_PRODUCTS.unshift(newProduct);
    return newProduct;
  }
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProductStock(productId: string, delta: number): Promise<void> {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) return;
    const current = productDoc.data()?.stock || 0;
    await updateDoc(productRef, {
      stock: Math.max(0, current + delta),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const prod = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (prod) prod.stock = Math.max(0, prod.stock + delta);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.id !== productId);
  }
}

// --- ORDERS API ---
export async function getOrders(): Promise<Order[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => mapOrder(d.id, d.data()));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    return MOCK_ORDERS;
  }
}

export async function getOrdersByClient(clientId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapOrder(d.id, d.data()));
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...order, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateOrderShipping(
  orderId: string,
  status: ShippingStatus,
  trackingNumber?: string
): Promise<Order | null> {
  const orderRef = doc(db, 'orders', orderId);
  const orderDoc = await getDoc(orderRef);
  if (!orderDoc.exists()) return null;

  const current = orderDoc.data() as Order;
  const updateData: Partial<Order> = {
    shippingStatus: status,
    updatedAt: serverTimestamp() as any,
    trackingUpdates: [
      ...(current.trackingUpdates || []),
      { status, timestamp: new Date(), description: `Estado actualizado a ${status}` },
    ],
  };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;

  await updateDoc(orderRef, updateData);
  return { ...current, ...updateData, id: orderId } as Order;
}

export async function updateOrderStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus'],
  shippingStatus: ShippingStatus
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus,
    shippingStatus,
    updatedAt: serverTimestamp(),
  });
}

export type { OrderItem };
