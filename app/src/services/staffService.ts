// ============================================================
// Veterinaria La Plata — Staff Services (GIS / Historia Clínica)
// Medical Records, Grooming Records, Marketing Campaigns,
// Clinical Templates, Prescriptions, Follow-ups & Admin
// ============================================================
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  arrayUnion,
} from 'firebase/firestore';
import { db, DEMO_MODE } from '../config/firebase';
import {
  MedicalRecord,
  GroomingRecord,
  Campaign,
  Appointment,
  ClinicalTemplate,
  Prescription,
  FollowUp,
  Attachment,
  MedicalRecordType,
  Pet,
  TimelineEvent,
} from '../types';
import { normalizeText, buildSearchTokens } from './searchUtils';

// ============================================================
// MOCK DATA (solo DEMO_MODE)
// ============================================================
const MOCK_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'med-1',
    petId: 'pet-1',
    petName: 'Luna',
    vetId: 'vet-001',
    vetName: 'Dr. Alejandro Fernández',
    type: 'consultation',
    date: new Date('2024-05-10'),
    diagnosis: 'Otitis externa leve en oído derecho',
    treatment: 'Limpieza ótica semanal + Gotas Oticas 5 gotas cada 12hs por 7 días',
    medication: 'Otisint Gotas 15ml',
    vitals: { temperatureC: 38.6, heartRate: 96, weightKg: 26.5 },
    observations: 'Control en 7 días para evaluar evolución.',
    attachments: [],
    createdBy: 'vet-001',
    updatedBy: 'vet-001',
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-10'),
  },
];

const MOCK_GROOMING_RECORDS: GroomingRecord[] = [
  {
    id: 'groom-1',
    petId: 'pet-1',
    petName: 'Luna',
    groomerId: 'groomer-001',
    groomerName: 'Laura Estética',
    date: new Date('2024-06-01'),
    serviceType: 'bath_and_haircut',
    productsUsed: ['Shampoo Hipoalergénico Avena', 'Acondicionador Desenredante'],
    observations: 'Comportamiento excelente. Se realizó deslanado profundo.',
    nextVisitRecommended: new Date('2024-07-01'),
    createdAt: new Date('2024-06-01'),
  },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Promoción Verano — 20% OFF en Protectores Solares',
    message: 'Cuidá a tu mascota del sol este verano con descuentos exclusivos en petshop.',
    type: 'seasonal',
    segment: 'all',
    sentAt: new Date('2024-01-15'),
    stats: { sent: 150, opened: 98, clicked: 42 },
    createdBy: 'admin-001',
    status: 'sent',
    createdAt: new Date('2024-01-15'),
  },
];

const DEFAULT_TEMPLATES: ClinicalTemplate[] = [
  {
    id: 'tpl-otitis',
    name: 'Otitis externa',
    type: 'consultation',
    diagnosis: 'Otitis externa',
    treatment: 'Limpieza ótica con solución otológica',
    medications: [{ name: 'Solución otológica', via: 'ótica', dose: '5 gotas', frequency: 'cada 12 hs', duration: '7 días' }],
    observations: 'Evitar humedad en oídos durante el tratamiento.',
    category: 'Oídos',
    active: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
  {
    id: 'tpl-vacuna',
    name: 'Vacunación (polivalente)',
    type: 'vaccination',
    diagnosis: 'Plan de vacunación',
    treatment: 'Aplicación de vacuna polivalente',
    medications: [{ name: 'Vacuna polivalente', via: 'inyectable', dose: '1 dosis', frequency: 'dosis única' }],
    observations: 'Registrar carné. Próxima dosis según esquema.',
    category: 'Vacunas',
    active: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
  {
    id: 'tpl-desparasitar',
    name: 'Desparasitación',
    type: 'deworming',
    diagnosis: 'Control parasitario',
    treatment: 'Desparasitación de amplio espectro',
    medications: [{ name: 'Antiparasitario', via: 'oral', dose: 'Según peso', frequency: 'dosis única' }],
    observations: 'Repetir según plan de cada paciente.',
    category: 'Preventiva',
    active: true,
    createdBy: 'system',
    createdAt: new Date(),
  },
];

// ============================================================
// HELPERS
// ============================================================
const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

// Normaliza texto para búsqueda (minúsculas, sin tildes)
export { normalizeText, buildSearchTokens } from './searchUtils';

const mapAttachment = (value: any): Attachment => {
  if (typeof value === 'string') return { url: value, kind: 'image' };
  if (value && typeof value === 'object') {
    return {
      url: value.url,
      kind: value.kind === 'pdf' || value.kind === 'lab' ? value.kind : 'image',
      caption: value.caption,
    };
  }
  return { url: String(value), kind: 'image' };
};

const mapMedicalRecord = (id: string, data: any): MedicalRecord => ({
  id,
  ...data,
  date: toDate(data?.date),
  nextDoseDate: data?.nextDoseDate ? toDate(data.nextDoseDate) : undefined,
  attachments: Array.isArray(data?.attachments) ? data.attachments.map(mapAttachment) : [],
  createdAt: toDate(data?.createdAt),
  updatedAt: toDate(data?.updatedAt),
});

const mapGroomingRecord = (id: string, data: any): GroomingRecord => ({
  id,
  ...data,
  date: toDate(data?.date),
  nextVisitRecommended: data?.nextVisitRecommended ? toDate(data.nextVisitRecommended) : undefined,
  createdAt: toDate(data?.createdAt),
});

const mapCampaign = (id: string, data: any): Campaign => ({
  id,
  ...data,
  scheduledAt: data?.scheduledAt ? toDate(data.scheduledAt) : undefined,
  sentAt: data?.sentAt ? toDate(data.sentAt) : undefined,
  createdAt: toDate(data?.createdAt),
});

const mapTemplate = (id: string, data: any): ClinicalTemplate => ({
  id,
  ...data,
  createdAt: toDate(data?.createdAt),
});

const mapPrescription = (id: string, data: any): Prescription => ({
  id,
  ...data,
  issuedAt: toDate(data?.issuedAt),
  createdAt: toDate(data?.createdAt),
});

const mapFollowUp = (id: string, data: any): FollowUp => ({
  id,
  ...data,
  dueDate: toDate(data?.dueDate),
  createdAt: toDate(data?.createdAt),
  completedAt: data?.completedAt ? toDate(data.completedAt) : undefined,
});

// ============================================================
// VET API — Medical Records
// ============================================================
export async function getMedicalRecordsByPet(
  petId: string,
  opts?: { pageSize?: number; startAfter?: QueryDocumentSnapshot<DocumentData> }
): Promise<{ records: MedicalRecord[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  if (!petId) return { records: [] };
  const pageSize = opts?.pageSize ?? 30;
  try {
    let q = query(
      collection(db, 'medicalRecords'),
      where('petId', '==', petId),
      orderBy('date', 'desc'),
      limit(pageSize)
    );
    if (opts?.startAfter) q = query(q, startAfter(opts.startAfter));

    const snapshot = await getDocs(q);
    const lastDoc = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    return {
      records: snapshot.docs.map((d) => mapMedicalRecord(d.id, d.data())),
      lastDoc,
    };
  } catch (error) {
    console.log('getMedicalRecordsByPet error:', error);
    if (!DEMO_MODE) throw error;
    const filtered = MOCK_MEDICAL_RECORDS.filter((r) => r.petId === petId);
    return { records: filtered };
  }
}

export async function getAllMedicalRecords(): Promise<MedicalRecord[]> {
  const snapshot = await getDocs(query(collection(db, 'medicalRecords'), orderBy('date', 'desc')));
  return snapshot.docs.map((d) => mapMedicalRecord(d.id, d.data()));
}

export async function addMedicalRecord(
  record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> &
    Partial<Pick<MedicalRecord, 'createdBy' | 'updatedBy'>>
): Promise<MedicalRecord> {
  try {
    const now = serverTimestamp();
    const docRef = await addDoc(collection(db, 'medicalRecords'), {
      ...record,
      attachments: (record.attachments || []).map((a) =>
        typeof a === 'string' ? { url: a, kind: 'image' } : a
      ),
      createdBy: record.createdBy || record.vetId,
      updatedBy: record.updatedBy || record.vetId,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      ...record,
      attachments: (record.attachments || []).map(mapAttachment),
      createdBy: record.createdBy || record.vetId,
      updatedBy: record.updatedBy || record.vetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as MedicalRecord;
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newRecord: MedicalRecord = {
      id: `med-${Date.now()}`,
      ...record,
      attachments: (record.attachments || []).map(mapAttachment),
      createdBy: record.createdBy || record.vetId,
      updatedBy: record.updatedBy || record.vetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as MedicalRecord;
    MOCK_MEDICAL_RECORDS.unshift(newRecord);
    return newRecord;
  }
}

// ============================================================
// VET API — Búsqueda de pacientes (server-side)
// ============================================================
export async function searchPets(queryText: string, pageSize = 30): Promise<Pet[]> {
  const trimmed = (queryText || '').trim();

  try {
    if (!trimmed) {
      // Pacientes recientes
      const q = query(collection(db, 'pets'), orderBy('createdAt', 'desc'), limit(pageSize));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pet);
    }

    const tokens = normalizeText(trimmed).split(/\s+/).filter((w) => w.length >= 2);
    if (tokens.length === 0) return [];

    const q = query(
      collection(db, 'pets'),
      where('searchTokens', 'array-contains-any', tokens.slice(0, 10)),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Pet);
  } catch (error) {
    console.log('searchPets error:', error);
    if (!DEMO_MODE) throw error;
    // Fallback demo
    const all = [...MOCK_MEDICAL_RECORDS.map((r) => r.petName).filter(Boolean)];
    return all
      .filter((name) => name.toLowerCase().includes(trimmed.toLowerCase()))
      .map((name, i) => ({
        id: `pet-search-${i}`,
        ownerId: 'client-001',
        name,
        species: 'dog' as const,
        breed: '',
        birthDate: new Date(),
        sex: 'female' as const,
        currentWeight: 0,
        healthStatus: 'green' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  }
}

// ============================================================
// VET API — Timeline consolidado (GIS)
// ============================================================
export { TimelineEvent }; // re-export tipo

const medicalLabel: Record<string, string> = {
  consultation: '🩺 Consulta',
  vaccination: '💉 Vacunación',
  study: '🔬 Estudio',
  surgery: '🏥 Cirugía',
  deworming: '🪱 Desparasitación',
};

const groomingLabel: Record<string, string> = {
  bath: '🛁 Baño',
  haircut: '✂️ Corte',
  bath_and_haircut: '🛁✂️ Baño + Corte',
  detangling: '🔗 Deslanado',
  skin_treatment: '🧴 Tratamiento de piel',
  nail_trim: '💅 Corte de uñas',
  ear_cleaning: '👂 Limpieza de oídos',
};

export async function getPetTimeline(
  petId: string,
  pageSize = 40
): Promise<TimelineEvent[]> {
  const [medResult, grooming, appointments] = await Promise.all([
    getMedicalRecordsByPet(petId, { pageSize }),
    getGroomingRecordsByPet(petId),
    getAppointmentsByPet(petId),
  ]);

  const events: TimelineEvent[] = [
    ...medResult.records.map((r) => ({
      id: `med-${r.id}`,
      kind: 'medical' as const,
      date: r.date,
      title: medicalLabel[r.type] || r.type,
      subtitle: r.diagnosis,
      data: r,
    })),
    ...grooming.map((g) => ({
      id: `groom-${g.id}`,
      kind: 'grooming' as const,
      date: g.date,
      title: groomingLabel[g.serviceType] || g.serviceType,
      subtitle: g.observations,
      data: g,
    })),
    ...appointments.map((a) => ({
      id: `appt-${a.id}`,
      kind: 'appointment' as const,
      date: a.date,
      title: `📅 ${a.petName}`,
      subtitle: a.type === 'grooming' ? 'Turno de peluquería' : 'Turno clínico',
      data: a,
    })),
  ];

  return events
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, pageSize);
}

async function getAppointmentsByPet(petId: string): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('petId', '==', petId),
      orderBy('date', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, date: toDate(data.date) } as Appointment;
    });
  } catch (error) {
    console.log('getAppointmentsByPet error:', error);
    if (DEMO_MODE) {
      return MOCK_MEDICAL_RECORDS.filter((r) => r.petId === petId).map(() => ({
        id: `appt-mock-${Date.now()}`,
        petId,
        petName: 'Luna',
        ownerId: 'client-001',
        ownerName: 'María González',
        type: 'vaccination' as const,
        date: new Date(Date.now() + 86400000),
        timeSlot: 'morning' as const,
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }
    return [];
  }
}

// ============================================================
// GROOMER API
// ============================================================
export async function getGroomingRecordsByPet(petId: string): Promise<GroomingRecord[]> {
  if (!petId) return [];
  try {
    const q = query(
      collection(db, 'groomingRecords'),
      where('petId', '==', petId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapGroomingRecord(d.id, d.data()));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    return MOCK_GROOMING_RECORDS.filter((r) => r.petId === petId);
  }
}

export async function addGroomingRecord(
  record: Omit<GroomingRecord, 'id' | 'createdAt'>
): Promise<GroomingRecord> {
  try {
    const docRef = await addDoc(collection(db, 'groomingRecords'), {
      ...record,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...record, createdAt: new Date() };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newRecord: GroomingRecord = {
      id: `groom-${Date.now()}`,
      ...record,
      createdAt: new Date(),
    };
    MOCK_GROOMING_RECORDS.unshift(newRecord);
    return newRecord;
  }
}

// ============================================================
// CLINICAL TEMPLATES API
// ============================================================
export async function getClinicalTemplates(type?: MedicalRecordType): Promise<ClinicalTemplate[]> {
  try {
    let q = query(collection(db, 'clinicalTemplates'), where('active', '==', true));
    if (type) q = query(q, where('type', '==', type));
    const snapshot = await getDocs(q);
    const templates = snapshot.docs.map((d) => mapTemplate(d.id, d.data()));
    return templates.length > 0 ? templates : DEFAULT_TEMPLATES.filter((t) => !type || t.type === type);
  } catch (error) {
    console.log('getClinicalTemplates error:', error);
    if (!DEMO_MODE) throw error;
    return DEFAULT_TEMPLATES.filter((t) => !type || t.type === type);
  }
}

export async function createClinicalTemplate(
  template: Omit<ClinicalTemplate, 'id' | 'createdAt'>
): Promise<ClinicalTemplate> {
  const docRef = await addDoc(collection(db, 'clinicalTemplates'), {
    ...template,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...template, createdAt: new Date() };
}

// ============================================================
// PRESCRIPTIONS API
// ============================================================
export async function createPrescription(
  prescription: Omit<Prescription, 'id' | 'createdAt'>
): Promise<Prescription> {
  const docRef = await addDoc(collection(db, 'prescriptions'), {
    ...prescription,
    status: prescription.status || 'active',
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...prescription, status: prescription.status || 'active', createdAt: new Date() };
}

export async function getPrescriptionsByPet(petId: string): Promise<Prescription[]> {
  if (!petId) return [];
  const q = query(
    collection(db, 'prescriptions'),
    where('petId', '==', petId),
    orderBy('issuedAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapPrescription(d.id, d.data()));
}

// ============================================================
// FOLLOW-UPS API
// ============================================================
export async function createFollowUp(
  followUp: Omit<FollowUp, 'id' | 'createdAt' | 'status'>
): Promise<FollowUp> {
  const docRef = await addDoc(collection(db, 'followUps'), {
    ...followUp,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...followUp, status: 'pending', createdAt: new Date() };
}

export async function getFollowUpsByVet(vetId: string, includeDone = false): Promise<FollowUp[]> {
  if (!vetId) return [];
  try {
    const q = query(
      collection(db, 'followUps'),
      where('vetId', '==', vetId),
      where('status', 'in', includeDone ? ['pending', 'overdue', 'done'] : ['pending', 'overdue']),
      orderBy('dueDate', 'asc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapFollowUp(d.id, d.data()));
  } catch (error) {
    console.log('getFollowUpsByVet error:', error);
    return [];
  }
}

export async function completeFollowUp(followUpId: string): Promise<void> {
  await updateDoc(doc(db, 'followUps', followUpId), {
    status: 'done',
    completedAt: serverTimestamp(),
  });
}

export async function markFollowUpsOverdue(): Promise<void> {
  try {
    const q = query(
      collection(db, 'followUps'),
      where('status', '==', 'pending'),
      where('dueDate', '<', new Date())
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((d) => updateDoc(d.ref, { status: 'overdue' }))
    );
  } catch (error) {
    console.log('markFollowUpsOverdue error:', error);
  }
}

// ============================================================
// MARKETING API
// ============================================================
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => mapCampaign(d.id, d.data()));
  } catch (error) {
    if (!DEMO_MODE) throw error;
    return MOCK_CAMPAIGNS;
  }
}

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'stats' | 'status'>
): Promise<Campaign> {
  try {
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaign,
      status: 'scheduled',
      sentAt: campaign.scheduledAt ? null : serverTimestamp(),
      stats: { sent: 0, opened: 0, clicked: 0 },
      createdAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      ...campaign,
      status: campaign.scheduledAt ? 'scheduled' : 'sent',
      stats: { sent: 0, opened: 0, clicked: 0 },
      createdAt: new Date(),
    };
  } catch (error) {
    if (!DEMO_MODE) throw error;
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      ...campaign,
      status: campaign.scheduledAt ? 'scheduled' : 'sent',
      sentAt: campaign.scheduledAt ? undefined : new Date(),
      stats: { sent: 0, opened: 0, clicked: 0 },
      createdAt: new Date(),
    };
    MOCK_CAMPAIGNS.unshift(newCamp);
    return newCamp;
  }
}

export async function updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<void> {
  await updateDoc(doc(db, 'campaigns', campaignId), data);
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  await deleteDoc(doc(db, 'campaigns', campaignId));
}

// ============================================================
// RE-EXPORTS
// ============================================================
export { getAllAppointments } from './dataService';
export type { Appointment };
