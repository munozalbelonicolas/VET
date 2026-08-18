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

export type AttachmentKind = 'image' | 'pdf' | 'lab';

export interface Attachment {
  url: string;
  kind: AttachmentKind;
  caption?: string;
}

export interface Vitals {
  temperatureC?: number;
  heartRate?: number;
  respiratoryRate?: number;
  weightKg?: number;
  bodyCondition?: 1 | 2 | 3 | 4 | 5; // 1=caquexia, 5=obesidad
}

export interface MedicationDose {
  name: string;
  via: string; // oral, tópica, inyectable, ótica...
  dose: string; // ej: "5 gotas", "1/4 comprimido"
  frequency: string; // ej: "cada 12 hs"
  duration?: string; // ej: "7 días"
  instructions?: string;
}

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled';

export interface Prescription {
  id: string;
  petId: string;
  petName: string;
  medicalRecordId?: string;
  vetId: string;
  vetName: string;
  medications: MedicationDose[];
  indications?: string;
  issuedAt: Date;
  status: PrescriptionStatus;
  createdAt: Date;
}

export interface ClinicalTemplate {
  id: string;
  name: string;
  type: MedicalRecordType;
  diagnosis?: string;
  treatment?: string;
  medications: MedicationDose[];
  observations?: string;
  category?: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
}

export type FollowUpStatus = 'pending' | 'done' | 'overdue';

export interface FollowUp {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  vetId: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: FollowUpStatus;
  relatedRecordId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TimelineEvent {
  id: string;
  kind: 'medical' | 'grooming' | 'appointment';
  date: Date;
  title: string;
  subtitle?: string;
  data: MedicalRecord | GroomingRecord | Appointment;
}

export type GroomingServiceType = 'bath' | 'haircut' | 'bath_and_haircut' | 'hygienic_cut' | 'detangling' | 'skin_treatment' | 'nail_trim' | 'ear_cleaning';

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
  active?: boolean;
  specialty?: string;
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
  searchTokens?: string[];
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
  medication?: string; // legado: texto libre (migrado a medicationDoses)
  medicationDoses?: MedicationDose[];
  vitals?: Vitals;
  observations?: string;
  nextDoseDate?: Date;
  attachments: Attachment[];
  searchTokens?: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface GroomingRecord {
  id: string;
  petId: string;
  petName: string;
  groomerId: string;
  groomerName: string;
  date: Date;
  serviceType: GroomingServiceType;
  haircutStyle?: string;
  productsUsed: string[];
  photos?: string[];
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
  couponCode?: string;
  createdAt: Date;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  target?: string;
  details?: string;
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
