import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    });

    // Update local state if it's the current user
    const currentState = useAuthStore.getState();
    if (currentState.user && currentState.user.id === userId) {
      useAuthStore.getState().setUser({
        ...currentState.user,
        ...data,
      } as User);
    }
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    
    // Fallback: Just update local store if Firestore fails (for offline/demo mode)
    const currentState = useAuthStore.getState();
    if (currentState.user && currentState.user.id === userId) {
      useAuthStore.getState().setUser({
        ...currentState.user,
        ...data,
      } as User);
    }
  }
}
