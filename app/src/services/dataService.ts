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
import { db } from '../config/firebase';
import { Pet, Appointment, MedicalRecord, GroomingRecord } from '../types';

// --- MOCK DATA FOR DEV & DEMO ---
let MOCK_PETS: Pet[] = [
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

let MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    petId: 'pet-1',
    petName: 'Luna',
    ownerId: 'client-001',
    ownerName: 'María González',
    type: 'vaccination',
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
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
    date: new Date(Date.now() + 86400000 * 5), // 5 days from now
    timeSlot: 'afternoon',
    status: 'pending',
    notes: 'Baño y deslanado.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pet-3',
    ownerId: 'client-001',
    name: 'Felipe',
    species: 'dog',
    breed: 'Yorky (Yorkshire Terrier)',
    birthDate: new Date('2026-04-10'),
    sex: 'male',
    currentWeight: 1.15,
    healthStatus: 'green',
    ownerName: 'Nicolas',
    notes: 'Cachorro alegre y juguetón.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// --- PETS API ---
export async function getAllPets(): Promise<Pet[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'pets'));
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        birthDate: doc.data().birthDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Pet[];
    }
  } catch (error) {
    console.log('Using mock pets data for all pets');
  }
  return MOCK_PETS;
}

export async function getPetsByOwner(ownerId: string): Promise<Pet[]> {
  try {
    const q = query(collection(db, 'pets'), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        birthDate: doc.data().birthDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Pet[];
    }
  } catch (error) {
    console.log('Using mock pets data (Firebase not connected or empty)');
  }
  return MOCK_PETS.filter((p) => p.ownerId === ownerId || ownerId === 'client-001');
}

export async function addPet(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
  try {
    const docRef = await addDoc(collection(db, 'pets'), {
      ...petData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...petData, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    const newPet: Pet = {
      id: `pet-${Date.now()}`,
      ...petData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_PETS.push(newPet);
    return newPet;
  }
}

// --- APPOINTMENTS API ---
export async function getAppointmentsByOwner(ownerId: string): Promise<Appointment[]> {
  try {
    const q = query(collection(db, 'appointments'), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Appointment[];
    }
  } catch (error) {
    console.log('Using mock appointments data');
  }
  return MOCK_APPOINTMENTS.filter((a) => a.ownerId === ownerId);
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

export async function updatePet(petId: string, data: Partial<Pet>): Promise<void> {
  try {
    const petRef = doc(db, 'pets', petId);
    await updateDoc(petRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating pet in Firestore:', error);
    // Fallback: update in MOCK_PETS
    const index = MOCK_PETS.findIndex(p => p.id === petId);
    if (index !== -1) {
      MOCK_PETS[index] = { ...MOCK_PETS[index], ...data };
    }
  }
}
