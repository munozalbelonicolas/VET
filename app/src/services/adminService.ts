// ============================================================
// Veterinaria La Plata — Admin Service
// Auditoría, seguimientos globales, export CSV y campañas push
// ============================================================
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminLog, FollowUp, Campaign, User, NotificationType } from '../types';
import { createInAppNotification } from './notificationService';

const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

// ============================================================
// AUDITORÍA
// ============================================================
export async function logAdminAction(
  admin: { id: string; name?: string },
  action: string,
  target?: string,
  details?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'adminLogs'), {
      adminId: admin.id,
      adminName: admin.name || '',
      action,
      target: target || '',
      details: details || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.log('logAdminAction error:', error);
  }
}

export async function getAdminLogs(max = 50): Promise<AdminLog[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), limit(max)));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: toDate(d.data()?.createdAt),
    })) as AdminLog[];
  } catch (error) {
    console.log('getAdminLogs error:', error);
    return [];
  }
}

// ============================================================
// SEGUIMIENTOS GLOBALES (admin)
// ============================================================
export async function getAllFollowUps(includeDone = false): Promise<FollowUp[]> {
  try {
    const q = query(
      collection(db, 'followUps'),
      where('status', 'in', includeDone ? ['pending', 'overdue', 'done'] : ['pending', 'overdue']),
      orderBy('dueDate', 'asc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      dueDate: toDate(d.data()?.dueDate),
      createdAt: toDate(d.data()?.createdAt),
      completedAt: d.data()?.completedAt ? toDate(d.data()?.completedAt) : undefined,
    })) as FollowUp[];
  } catch (error) {
    console.log('getAllFollowUps error:', error);
    return [];
  }
}

// ============================================================
// EXPORT CSV
// ============================================================
const escapeCsv = (value: any): string => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const toCsv = (headers: string[], rows: (string | number)[][]): string =>
  [headers.map(escapeCsv).join(';'), ...rows.map((r) => r.map(escapeCsv).join(';'))].join('\n');

// ============================================================
// CAMPAÑAS PUSH A CLIENTES
// ============================================================
export async function getAllClients(max = 500): Promise<User[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'client'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as User[];
  } catch (error) {
    console.log('getAllClients error:', error);
    return [];
  }
}

export async function getOwnerIdsBySpecies(species: 'dog' | 'cat', max = 500): Promise<string[]> {
  try {
    const q = query(collection(db, 'pets'), where('species', '==', species), limit(max));
    const snapshot = await getDocs(q);
    return Array.from(new Set(snapshot.docs.map((d) => d.data()?.ownerId).filter(Boolean)));
  } catch (error) {
    console.log('getOwnerIdsBySpecies error:', error);
    return [];
  }
}

/**
 * Envía una campaña como notificación in-app a los clientes del segmento.
 * Si la campaña tiene couponCode, lo incluye en los datos de la notificación
 * para que el cliente pueda aplicarlo en la tienda.
 */
export async function sendCampaignPush(
  campaign: Pick<Campaign, 'id' | 'title' | 'message' | 'segment' | 'couponCode'>
): Promise<{ sent: number }> {
  try {
    let userIds: string[] = [];

    switch (campaign.segment) {
      case 'dog_owners':
        userIds = await getOwnerIdsBySpecies('dog');
        break;
      case 'cat_owners':
        userIds = await getOwnerIdsBySpecies('cat');
        break;
      default:
        userIds = (await getAllClients()).map((u) => u.id);
    }

    if (userIds.length === 0) return { sent: 0 };

    const data: Record<string, string> = { campaignId: campaign.id };
    if (campaign.couponCode) data.couponCode = campaign.couponCode;

    const body = campaign.couponCode
      ? `${campaign.message} Usá el código ${campaign.couponCode} en la tienda.`
      : campaign.message;

    // Enviar en lotes para no saturar el cliente
    const BATCH = 50;
    let sent = 0;
    for (let i = 0; i < userIds.length; i += BATCH) {
      const batch = userIds.slice(i, i + BATCH);
      await Promise.all(
        batch.map((userId) =>
          createInAppNotification({
            userId,
            type: 'promotion' as NotificationType,
            title: campaign.title,
            body,
            data,
          }).catch(() => {})
        )
      );
      sent += batch.length;
    }
    return { sent };
  } catch (error) {
    console.log('sendCampaignPush error:', error);
    return { sent: 0 };
  }
}
