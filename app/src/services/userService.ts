import { doc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserRole } from '../types';
import { useAuthStore } from '../store/authStore';

const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

export const STAFF_ROLES: UserRole[] = ['vet', 'groomer', 'receptionist', 'admin'];

export async function getStaffUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), where('role', 'in', STAFF_ROLES));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toDate(d.data()?.createdAt),
    updatedAt: toDate(d.data()?.updatedAt),
  })) as User[];
}

export async function setStaffActive(userId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const payload = { ...data } as Record<string, any>;

  // No enviar timestamps del cliente: usar serverTimestamp
  delete payload.createdAt;
  delete payload.updatedAt;

  await updateDoc(userRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });

  // Actualizar estado local si es el usuario actual
  const currentState = useAuthStore.getState();
  if (currentState.user && currentState.user.id === userId) {
    useAuthStore.getState().setUser({
      ...currentState.user,
      ...data,
    } as User);
  }
}
