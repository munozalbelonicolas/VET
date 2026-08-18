// ============================================================
// Veterinaria La Plata — Waiting Room Queue Service
// ============================================================
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, DEMO_MODE } from '../config/firebase';

export interface QueueItem {
  id: string;
  ticketNumber: string;
  petName: string;
  petId?: string;
  ownerId?: string;
  ownerName: string;
  reason: string;
  doctorOrRoom?: string;
  arrivalTime: Date;
  status: 'waiting' | 'calling' | 'in_consultation' | 'completed';
}

// --- MOCK DATA (solo DEMO_MODE) ---
let MOCK_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    ticketNumber: 'A-01',
    petName: 'Luna',
    ownerName: 'María González',
    reason: 'Vacunación Séxtuple',
    doctorOrRoom: 'Consultorio 1 (Dr. Fernández)',
    arrivalTime: new Date(Date.now() - 1000 * 60 * 20),
    status: 'calling',
  },
  {
    id: 'q-2',
    ticketNumber: 'A-02',
    petName: 'Max',
    ownerName: 'Carlos Pérez',
    reason: 'Consulta General por tos',
    doctorOrRoom: 'Consultorio 2 (Dra. Gómez)',
    arrivalTime: new Date(Date.now() - 1000 * 60 * 15),
    status: 'waiting',
  },
  {
    id: 'q-3',
    ticketNumber: 'A-03',
    petName: 'Bella',
    ownerName: 'Ana López',
    reason: 'Peluquería y Baño',
    doctorOrRoom: 'Peluquería 1',
    arrivalTime: new Date(Date.now() - 1000 * 60 * 5),
    status: 'waiting',
  },
];

const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

const mapQueueItem = (id: string, data: any): QueueItem => ({
  id,
  ...data,
  arrivalTime: toDate(data?.arrivalTime),
});

let mockTicketCounter = 4;

export const getQueue = async (): Promise<QueueItem[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, 'waitingRoom'), orderBy('arrivalTime', 'asc')));
    return snapshot.docs.map((d) => mapQueueItem(d.id, d.data()));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    return [...MOCK_QUEUE];
  }
};

export const subscribeToQueue = (onChange: (items: QueueItem[]) => void): Unsubscribe => {
  const q = query(collection(db, 'waitingRoom'), orderBy('arrivalTime', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => mapQueueItem(d.id, d.data())));
    },
    (error) => {
      console.log('subscribeToQueue error:', error);
      if (DEMO_MODE) onChange([...MOCK_QUEUE]);
    }
  );
};

export const addToQueue = async (
  petName: string,
  ownerName: string,
  reason: string,
  doctorOrRoom?: string,
  petId?: string
): Promise<QueueItem> => {
  try {
    const docRef = await addDoc(collection(db, 'waitingRoom'), {
      petName,
      ...(petId ? { petId } : {}),
      ownerName,
      reason,
      doctorOrRoom: doctorOrRoom || 'Consultorio 1',
      arrivalTime: new Date(),
      status: 'waiting',
    });
    return {
      id: docRef.id,
      petName,
      petId,
      ownerName,
      reason,
      doctorOrRoom: doctorOrRoom || 'Consultorio 1',
      arrivalTime: new Date(),
      status: 'waiting',
      ticketNumber: `A-${docRef.id.slice(0, 4).toUpperCase()}`,
    };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newNum = mockTicketCounter < 10 ? `A-0${mockTicketCounter}` : `A-${mockTicketCounter}`;
    mockTicketCounter++;
    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      ticketNumber: newNum,
      petName,
      petId,
      ownerName,
      reason,
      doctorOrRoom: doctorOrRoom || 'Consultorio 1',
      arrivalTime: new Date(),
      status: 'waiting',
    };
    MOCK_QUEUE.push(newItem);
    return newItem;
  }
};

export const updateQueueStatus = async (
  id: string,
  status: QueueItem['status'],
  doctorOrRoom?: string
): Promise<QueueItem | null> => {
  try {
    await updateDoc(doc(db, 'waitingRoom', id), {
      status,
      ...(doctorOrRoom ? { doctorOrRoom } : {}),
    });
    return { id, status, doctorOrRoom } as QueueItem;
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const item = MOCK_QUEUE.find((q) => q.id === id);
    if (item) {
      item.status = status;
      if (doctorOrRoom) item.doctorOrRoom = doctorOrRoom;
      return item;
    }
    return null;
  }
};

export const removeFromQueue = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'waitingRoom', id));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    MOCK_QUEUE = MOCK_QUEUE.filter((q) => q.id !== id);
  }
};
