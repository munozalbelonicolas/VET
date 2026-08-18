// ============================================================
// Veterinaria La Plata — Clinic Config Service
// Lectura/edición de la configuración de la clínica (servicios,
// horarios, contacto). Singleton en veterinaryConfig/main
// ============================================================
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VeterinaryConfig } from '../types';

const CONFIG_DOC = 'main';

const DEFAULT_CONFIG: VeterinaryConfig = {
  name: 'Veterinaria La Plata',
  address: { street: '', number: '', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
  phone: '',
  email: '',
  socialMedia: {},
  hours: {
    monday: { enabled: true, morningStart: '09:00', morningEnd: '12:00', afternoonStart: '16:00', afternoonEnd: '19:00' },
    tuesday: { enabled: true, morningStart: '09:00', morningEnd: '12:00', afternoonStart: '16:00', afternoonEnd: '19:00' },
    wednesday: { enabled: true, morningStart: '09:00', morningEnd: '12:00', afternoonStart: '16:00', afternoonEnd: '19:00' },
    thursday: { enabled: true, morningStart: '09:00', morningEnd: '12:00', afternoonStart: '16:00', afternoonEnd: '19:00' },
    friday: { enabled: true, morningStart: '09:00', morningEnd: '12:00', afternoonStart: '16:00', afternoonEnd: '19:00' },
    saturday: { enabled: true, morningStart: '09:00', morningEnd: '13:00' },
    sunday: { enabled: false },
  },
  services: [
    { id: 'general', name: 'Consulta General', type: 'general', price: 15000, durationMinutes: 30, active: true },
    { id: 'vaccination', name: 'Vacunación', type: 'vaccination', price: 12000, durationMinutes: 20, active: true },
    { id: 'grooming', name: 'Peluquería y Baño', type: 'grooming', price: 22000, durationMinutes: 60, active: true },
    { id: 'emergency', name: 'Urgencia', type: 'emergency', price: 25000, durationMinutes: 30, active: true },
    { id: 'castration', name: 'Castración', type: 'castration', price: 45000, durationMinutes: 90, active: true },
  ],
  appointmentSlots: { durationMinutes: 30, intervalMinutes: 30, maxPerSlot: 1 },
};

export async function getClinicConfig(): Promise<VeterinaryConfig> {
  try {
    const snapshot = await getDoc(doc(db, 'veterinaryConfig', CONFIG_DOC));
    if (snapshot.exists()) {
      return { ...DEFAULT_CONFIG, ...snapshot.data() } as VeterinaryConfig;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.log('getClinicConfig error:', error);
    return DEFAULT_CONFIG;
  }
}

export async function saveClinicConfig(config: Partial<VeterinaryConfig>): Promise<void> {
  const ref = doc(db, 'veterinaryConfig', CONFIG_DOC);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, {
      ...config,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      ...DEFAULT_CONFIG,
      ...config,
      updatedAt: serverTimestamp(),
    });
  }
}
