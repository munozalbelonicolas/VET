// ============================================================
// Veterinaria La Plata — Products & E-commerce Service (Fase 3)
// ============================================================
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types';

export let MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Royal Canin Medium Adult 15kg',
    description: 'Alimento balanceado completo para perros adultos de raza mediana (de 11 a 25 kg) desde los 12 meses hasta los 7 años de edad.',
    category: 'food',
    species: 'dog',
    brand: 'Royal Canin',
    price: 68500,
    salePrice: 59900,
    variants: [],
    stock: 25,
    images: [require('../../assets/images/shop/dog_food_bag.png')],
    rating: 4.9,
    reviewCount: 42,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-2',
    name: 'Pro Plan Cat Sterilized 3kg',
    description: 'Alimento completo y balanceado para gatos adultos castrados o esterilizados. Control de peso e higiene urinaria.',
    category: 'food',
    species: 'cat',
    brand: 'Purina Pro Plan',
    price: 32000,
    salePrice: 28500,
    variants: [],
    stock: 18,
    images: [require('../../assets/images/shop/cat_food_bag.png')],
    rating: 4.8,
    reviewCount: 29,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-3',
    name: 'Pipeta NexGard Spectram Perros 10-25kg',
    description: 'Tratamiento y prevención de infestaciones por pulgas, garrapatas y parásitos internos.',
    category: 'medication',
    species: 'dog',
    brand: 'Boehringer',
    price: 18400,
    variants: [],
    stock: 50,
    images: [require('../../assets/images/shop/flea_medicine.png')],
    rating: 5.0,
    reviewCount: 65,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-4',
    name: 'Rascador Castillo con Cueva para Gatos',
    description: 'Rascador multinivel de felpa suave con postes de yute para afilar garras y cueva de descanso.',
    category: 'accessories',
    species: 'cat',
    brand: 'PetCraft',
    price: 45000,
    variants: [],
    stock: 8,
    images: [require('../../assets/images/shop/cat_tree.png')],
    rating: 4.7,
    reviewCount: 14,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-5',
    name: 'Shampoo Hipoalergénico Avena y Manzanilla 500ml',
    description: 'Shampoo suave para pieles sensibles y atópicas. Calma la picazón y suaviza el pelaje.',
    category: 'hygiene',
    species: 'both',
    brand: 'VetHygiene',
    price: 9800,
    variants: [],
    stock: 30,
    images: [require('../../assets/images/shop/pet_shampoo.png')],
    rating: 4.9,
    reviewCount: 38,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function getProducts(category?: string, species?: string): Promise<Product[]> {
  try {
    let q = collection(db, 'products') as any;
    
    // We do simple client-side filtering if complex queries fail
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      let products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Product[];

      if (category && category !== 'all') {
        products = products.filter(p => p.category === category);
      }
      if (species && species !== 'all') {
        products = products.filter(p => p.species === species || p.species === 'both');
      }
      return products;
    }
  } catch (error) {
    console.log('Using mock products data');
  }

  // Fallback
  let filtered = MOCK_PRODUCTS;
  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (species && species !== 'all') {
    filtered = filtered.filter((p) => p.species === species || p.species === 'both');
  }
  return filtered;
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>): Promise<Product> {
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
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_PRODUCTS = [newProduct, ...MOCK_PRODUCTS];
    return newProduct;
  }
}

export let MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-8891',
    clientId: 'client-001',
    clientName: 'María González',
    clientPhone: '+54 221 555-0002',
    items: [
      { productId: 'p1', productName: 'Royal Canin Adulto 15kg', productImage: null, price: 42000, quantity: 1, subtotal: 42000 },
    ],
    subtotal: 42000,
    discount: 0,
    total: 42000,
    paymentMethod: 'mercadopago',
    paymentStatus: 'paid',
    shippingAddress: { street: 'Diagonal 73', number: '567', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    shippingStatus: 'preparing',
    trackingNumber: 'TRACK-2026-8891',
    trackingUpdates: [
      { status: 'pending', timestamp: new Date('2026-08-08'), description: 'Pedido recibido' },
      { status: 'preparing', timestamp: new Date('2026-08-09'), description: 'En preparación en sucursal' },
    ],
    createdAt: new Date('2026-08-08T10:00:00'),
    updatedAt: new Date(),
  },
  {
    id: 'ORD-8892',
    clientId: 'client-002',
    clientName: 'Juan Carlos Pérez',
    clientPhone: '+54 221 555-0099',
    items: [
      { productId: 'p2', productName: 'Pro Plan Adult Skin & Stomach', productImage: null, price: 38500, quantity: 1, subtotal: 38500 },
    ],
    subtotal: 38500,
    discount: 0,
    total: 38500,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    shippingAddress: { street: 'Calle 50', number: '123', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    shippingStatus: 'shipped',
    trackingNumber: 'TRACK-2026-8892',
    trackingUpdates: [
      { status: 'pending', timestamp: new Date('2026-08-07'), description: 'Pedido recibido' },
      { status: 'shipped', timestamp: new Date('2026-08-08'), description: 'En camino con correo' },
    ],
    createdAt: new Date('2026-08-07T14:30:00'),
    updatedAt: new Date(),
  },
];

export async function getOrders(): Promise<Order[]> {
  return MOCK_ORDERS;
}

export async function updateOrderShipping(orderId: string, status: ShippingStatus, trackingNumber?: string): Promise<Order | null> {
  const order = MOCK_ORDERS.find(o => o.id === orderId);
  if (order) {
    order.shippingStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    order.trackingUpdates.push({
      status,
      timestamp: new Date(),
      description: `Estado actualizado a ${status}`,
    });
    order.updatedAt = new Date();
    return order;
  }
  return null;
}

export async function updateProductStock(productId: string, delta: number): Promise<void> {
  const prod = MOCK_PRODUCTS.find(p => p.id === productId);
  if (prod) {
    prod.stock = Math.max(0, prod.stock + delta);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  MOCK_PRODUCTS = MOCK_PRODUCTS.filter(p => p.id !== productId);
}
