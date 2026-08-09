// ============================================================
// Veterinaria La Plata — TypeScript Type Definitions
// Complete Firestore data model
// ============================================================

// --- Enums & Literals ---

export type UserRole = 'client' | 'vet' | 'groomer' | 'receptionist' | 'admin';

export type PetSpecies = 'dog' | 'cat';

export type PetSex = 'male' | 'female';

export type HealthStatus = 'green' | 'yellow' | 'red';

export type AppointmentType = 'general' | 'vaccination' | 'grooming' | 'emergency' | 'castration';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type TimeSlot = 'morning' | 'afternoon';

export type MedicalRecordType = 'consultation' | 'vaccination' | 'study' | 'surgery' | 'deworming';

export type GroomingServiceType = 'bath' | 'haircut' | 'bath_and_haircut' | 'detangling' | 'skin_treatment' | 'nail_trim' | 'ear_cleaning';

export type OrderPaymentMethod = 'mercadopago' | 'transfer';

export type OrderPaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export type ShippingStatus = 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';

export type NotificationType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'vaccine_reminder'
  | 'order_status'
  | 'promotion'
  | 'marketing'
  | 'vet_message';

export type CampaignSegment =
  | 'all'
  | 'dog_owners'
  | 'cat_owners'
  | 'inactive_clients'
  | 'specific_product_buyers';

export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

export type ProductCategory = 'food' | 'accessories' | 'medication' | 'hygiene' | 'toys';

// --- Interfaces ---

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: Address;
  role: UserRole;
  avatarUrl?: string;
  fcmTokens: string[];
  notificationPrefs: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  zipCode: string;
  notes?: string;
}

export interface NotificationPreferences {
  appointments: boolean;
  vaccines: boolean;
  promotions: boolean;
  orderUpdates: boolean;
  vetMessages: boolean;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  birthDate: Date;
  ageYears?: number;
  ageMonths?: number;
  sex: PetSex;
  currentWeight: number;
  avatarUrl?: string;
  ownerName?: string;
  healthStatus: HealthStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  professionalId?: string;
  professionalName?: string;
  type: AppointmentType;
  date: Date;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName: string;
  vetId: string;
  vetName: string;
  type: MedicalRecordType;
  date: Date;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  observations?: string;
  nextDoseDate?: Date;
  attachments: string[];
  createdAt: Date;
}

export interface GroomingRecord {
  id: string;
  petId: string;
  petName: string;
  groomerId: string;
  groomerName: string;
  date: Date;
  serviceType: GroomingServiceType;
  productsUsed: string[];
  observations?: string;
  nextVisitRecommended?: Date;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string; // e.g., "15kg", "Pollo", "Rojo"
  priceModifier: number; // +/- from base price
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  species: PetSpecies | 'both';
  brand: string;
  price: number;
  salePrice?: number;
  variants: ProductVariant[];
  stock: number;
  images: any[];
  rating: number;
  reviewCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: any;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: any;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface TrackingUpdate {
  status: ShippingStatus;
  timestamp: Date;
  description: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  clientPhone?: string;
  shippingAddress: Address;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  trackingUpdates: TrackingUpdate[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  type: 'discount' | 'product_promo' | 'seasonal';
  segment: CampaignSegment;
  segmentData?: Record<string, string>;
  scheduledAt?: Date;
  sentAt?: Date;
  stats: CampaignStats;
  createdBy: string;
  status: CampaignStatus;
  createdAt: Date;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  speciality?: string;
  active: boolean;
  schedule: WeeklySchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface DaySchedule {
  enabled: boolean;
  morningStart?: string; // "09:00"
  morningEnd?: string;   // "12:00"
  afternoonStart?: string; // "16:00"
  afternoonEnd?: string;   // "19:00"
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface AppointmentSlotConfig {
  durationMinutes: number;
  intervalMinutes: number;
  maxPerSlot: number;
}

export interface ServiceConfig {
  id: string;
  name: string;
  type: AppointmentType;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface VeterinaryConfig {
  name: string;
  address: Address;
  phone: string;
  email: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  hours: WeeklySchedule;
  services: ServiceConfig[];
  appointmentSlots: AppointmentSlotConfig;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

// --- Navigation Types ---

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  ClientApp: undefined;
  VetApp: undefined;
  GroomerApp: undefined;
  ReceptionistApp: undefined;
  AdminApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type ClientTabParamList = {
  Home: undefined;
  Appointments: undefined;
  Shop: undefined;
  Notifications: undefined;
  Profile: undefined;
};
