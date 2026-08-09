// ============================================================
// Veterinaria La Plata — Auth Service
// Firebase Authentication + Firestore user creation
// ============================================================
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

// --- Sign up with email ---
export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;

  const userData: Omit<User, 'id'> = {
    email,
    name,
    phone,
    address: {
      street: '',
      number: '',
      city: 'La Plata',
      province: 'Buenos Aires',
      zipCode: '',
    },
    role: 'client' as UserRole,
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: {
      appointments: true,
      vaccines: true,
      promotions: true,
      orderUpdates: true,
      vetMessages: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: firebaseUser.uid, ...userData };
}

// --- Sign in with email ---
export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return await getUserData(credential.user.uid);
}

// --- Sign in with Google Credential ---
export async function loginWithGoogleCredential(idToken: string): Promise<User> {
  const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const credential = await signInWithCredential(auth, googleCredential);
  const firebaseUser = credential.user;

  // Check if user already exists in Firestore
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const userData: Omit<User, 'id'> = {
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'Usuario Google',
      phone: firebaseUser.phoneNumber || '',
      address: {
        street: '',
        number: '',
        city: 'La Plata',
        province: 'Buenos Aires',
        zipCode: '',
      },
      role: 'client' as UserRole,
      avatarUrl: firebaseUser.photoURL || '',
      fcmTokens: [],
      notificationPrefs: {
        appointments: true,
        vaccines: true,
        promotions: true,
        orderUpdates: true,
        vetMessages: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: firebaseUser.uid, ...userData };
  }

  return await getUserData(firebaseUser.uid);
}

// --- Reset password ---
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// --- Sign out ---
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// --- Get user data from Firestore ---
export async function getUserData(uid: string): Promise<User> {
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    throw new Error('Usuario no encontrado');
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as User;
}

// --- Listen to auth state changes ---
export function onAuthChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// --- Mock auth for development (when Firebase is not configured) ---
const MOCK_USERS: Record<string, User> = {
  'admin@soyveterinario.com': {
    id: 'admin-001',
    email: 'admin@soyveterinario.com',
    name: 'Carlos Administrador',
    phone: '+54 221 555-0001',
    address: { street: 'Calle 7', number: '1234', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    role: 'admin',
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: { appointments: true, vaccines: true, promotions: true, orderUpdates: true, vetMessages: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  'cliente@mascota.com': {
    id: 'client-001',
    email: 'cliente@mascota.com',
    name: 'María González',
    phone: '+54 221 555-0002',
    address: { street: 'Diagonal 73', number: '567', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    role: 'client',
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: { appointments: true, vaccines: true, promotions: true, orderUpdates: true, vetMessages: true },
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date(),
  },
  'vet@soyvet.com': {
    id: 'vet-001',
    email: 'vet@soyvet.com',
    name: 'Dr. Alejandro Fernández',
    phone: '+54 221 555-0003',
    address: { street: 'Calle 50', number: '890', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    role: 'vet',
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: { appointments: true, vaccines: true, promotions: true, orderUpdates: true, vetMessages: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  'peluquero@pelu.com': {
    id: 'groomer-001',
    email: 'peluquero@pelu.com',
    name: 'Laura Estética',
    phone: '+54 221 555-0004',
    address: { street: 'Calle 12', number: '345', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    role: 'groomer',
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: { appointments: true, vaccines: true, promotions: false, orderUpdates: false, vetMessages: false },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  'recep@admin.com': {
    id: 'recep-001',
    email: 'recep@admin.com',
    name: 'Sofía Recepción',
    phone: '+54 221 555-0005',
    address: { street: 'Calle 8', number: '678', city: 'La Plata', province: 'Buenos Aires', zipCode: '1900' },
    role: 'receptionist',
    avatarUrl: '',
    fcmTokens: [],
    notificationPrefs: { appointments: true, vaccines: false, promotions: false, orderUpdates: true, vetMessages: false },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
};

export function mockLogin(email: string): User | null {
  return MOCK_USERS[email.toLowerCase()] ?? null;
}

export function getMockUsers(): Record<string, User> {
  return MOCK_USERS;
}
