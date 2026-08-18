// ============================================================
// Veterinaria La Plata — Pets & Appointments Services
// ============================================================
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, DEMO_MODE } from '../config/firebase';
import { Pet, Appointment, User } from '../types';
import { buildSearchTokens } from './searchUtils';

// --- MOCK DATA (solo DEMO_MODE) ---
const MOCK_PETS: Pet[] = [
  {
    id: 'pet-1',
    ownerId: 'client-001',
    name: 'Luna',
    species: 'dog',
    breed: 'Golden Retriever',
    birthDate: new Date('2021-05-10'),
    sex: 'female',
    currentWeight: 26.5,
    healthStatus: 'green',
    notes: 'Muy amigable, le teme a las tormentas.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pet-2',
    ownerId: 'client-001',
    name: 'Michi',
    species: 'cat',
    breed: 'Siames',
    birthDate: new Date('2022-11-15'),
    sex: 'male',
    currentWeight: 4.2,
    healthStatus: 'green',
    notes: 'Vacunación al día. Control de pulgas mensual.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    petId: 'pet-1',
    petName: 'Luna',
    ownerId: 'client-001',
    ownerName: 'María González',
    type: 'vaccination',
    date: new Date(Date.now() + 86400000 * 2),
    timeSlot: 'morning',
    status: 'confirmed',
    notes: 'Vacuna quíntuple anual.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-2',
    petId: 'pet-2',
    petName: 'Michi',
    ownerId: 'client-001',
    ownerName: 'María González',
    type: 'grooming',
    date: new Date(Date.now() + 86400000 * 5),
    timeSlot: 'afternoon',
    status: 'pending',
    notes: 'Baño y deslanado.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// --- Helpers de conversión ---
const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

const mapPet = (id: string, data: any): Pet => ({
  id,
  ...data,
  birthDate: toDate(data?.birthDate),
  createdAt: toDate(data?.createdAt),
  updatedAt: toDate(data?.updatedAt),
});

const mapAppointment = (id: string, data: any): Appointment => ({
  id,
  ...data,
  date: toDate(data?.date),
  createdAt: toDate(data?.createdAt),
  updatedAt: toDate(data?.updatedAt),
});

// --- PETS API ---
export async function getAllPets(): Promise<Pet[]> {
  const querySnapshot = await getDocs(collection(db, 'pets'));
  return querySnapshot.docs.map((d) => mapPet(d.id, d.data()));
}

export async function getPetsByOwner(ownerId: string): Promise<Pet[]> {
  if (!ownerId) return [];
  try {
    const q = query(collection(db, 'pets'), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => mapPet(d.id, d.data()));
  } catch (error) {
    console.log('getPetsByOwner error:', error);
    if (!DEMO_MODE) throw error;
    return MOCK_PETS.filter((p) => p.ownerId === ownerId);
  }
}

export async function getPetById(petId: string): Promise<Pet | null> {
  const snapshot = await getDoc(doc(db, 'pets', petId));
  if (!snapshot.exists()) return null;
  return mapPet(snapshot.id, snapshot.data());
}

export async function addPet(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'searchTokens'>): Promise<Pet> {
  try {
    const docRef = await addDoc(collection(db, 'pets'), {
      ...petData,
      searchTokens: buildSearchTokens(petData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...petData, searchTokens: buildSearchTokens(petData), createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newPet: Pet = {
      id: `pet-${Date.now()}`,
      ...petData,
      searchTokens: buildSearchTokens(petData),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_PETS.push(newPet);
    return newPet;
  }
}

export async function updatePet(petId: string, data: Partial<Pet>): Promise<void> {
  try {
    const petRef = doc(db, 'pets', petId);
    const petDoc = await getDoc(petRef);
    const current = petDoc.exists() ? petDoc.data() : {};
    const tokens = buildSearchTokens({
      name: data.name ?? current.name ?? '',
      breed: data.breed ?? current.breed,
      ownerName: data.ownerName ?? current.ownerName,
    });
    await updateDoc(petRef, {
      ...data,
      searchTokens: tokens,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const index = MOCK_PETS.findIndex((p) => p.id === petId);
    if (index !== -1) {
      MOCK_PETS[index] = { ...MOCK_PETS[index], ...data };
    }
  }
}

export async function deletePet(petId: string): Promise<void> {
  await deleteDoc(doc(db, 'pets', petId));
}

// --- APPOINTMENTS API ---
export async function getAppointmentsByOwner(ownerId: string): Promise<Appointment[]> {
  if (!ownerId) return [];
  try {
    const q = query(
      collection(db, 'appointments'),
      where('ownerId', '==', ownerId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => mapAppointment(d.id, d.data()));
  } catch (error) {
    console.log('getAppointmentsByOwner error:', error);
    if (!DEMO_MODE) throw error;
    return MOCK_APPOINTMENTS.filter((a) => a.ownerId === ownerId);
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => mapAppointment(d.id, d.data()));
}

export async function getAppointmentsByProfessional(professionalId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    orderBy('date', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => mapAppointment(d.id, d.data()));
}

export async function createAppointment(
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...appointmentData, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      ...appointmentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_APPOINTMENTS.push(newApp);
    return newApp;
  }
}

export async function updateAppointment(appointmentId: string, data: Partial<Appointment>): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'appointments', appointmentId));
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    // Silently fail — mock mode doesn't persist profile changes
  }
}
