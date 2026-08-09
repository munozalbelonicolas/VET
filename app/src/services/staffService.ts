// ============================================================
// Veterinaria La Plata — Staff Services (Fases 4 & 5)
// Medical Records, Grooming Records, Marketing Campaigns & Admin
// ============================================================
import { MedicalRecord, GroomingRecord, Campaign, User, Appointment } from '../types';

let MOCK_MEDICAL_RECORDS: MedicalRecord[] = [
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
    observations: 'Control en 7 días para evaluar evolución.',
    attachments: [],
    createdAt: new Date('2024-05-10'),
  },
  {
    id: 'med-2',
    petId: 'pet-1',
    petName: 'Luna',
    vetId: 'vet-001',
    vetName: 'Dr. Alejandro Fernández',
    type: 'vaccination',
    date: new Date('2024-03-15'),
    diagnosis: 'Vacunación de rutina',
    treatment: 'Aplicación vacuna Quíntuple (Nobivac DHPPi)',
    nextDoseDate: new Date('2025-03-15'),
    attachments: [],
    createdAt: new Date('2024-03-15'),
  },
];

let MOCK_GROOMING_RECORDS: GroomingRecord[] = [
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

let MOCK_CAMPAIGNS: Campaign[] = [
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

// --- VET API ---
export async function getMedicalRecordsByPet(petId: string): Promise<MedicalRecord[]> {
  return MOCK_MEDICAL_RECORDS.filter((r) => r.petId === petId);
}

export async function addMedicalRecord(
  record: Omit<MedicalRecord, 'id' | 'createdAt'>
): Promise<MedicalRecord> {
  const newRecord: MedicalRecord = {
    id: `med-${Date.now()}`,
    ...record,
    createdAt: new Date(),
  };
  MOCK_MEDICAL_RECORDS.unshift(newRecord);
  return newRecord;
}

// --- GROOMER API ---
export async function getGroomingRecordsByPet(petId: string): Promise<GroomingRecord[]> {
  return MOCK_GROOMING_RECORDS.filter((r) => r.petId === petId);
}

export async function addGroomingRecord(
  record: Omit<GroomingRecord, 'id' | 'createdAt'>
): Promise<GroomingRecord> {
  const newRecord: GroomingRecord = {
    id: `groom-${Date.now()}`,
    ...record,
    createdAt: new Date(),
  };
  MOCK_GROOMING_RECORDS.unshift(newRecord);
  return newRecord;
}

// --- MARKETING API ---
export async function getCampaigns(): Promise<Campaign[]> {
  return MOCK_CAMPAIGNS;
}

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'stats' | 'status'>
): Promise<Campaign> {
  const newCamp: Campaign = {
    id: `camp-${Date.now()}`,
    ...campaign,
    status: 'sent',
    sentAt: new Date(),
    stats: { sent: 120, opened: 0, clicked: 0 },
    createdAt: new Date(),
  };
  MOCK_CAMPAIGNS.unshift(newCamp);
  return newCamp;
}
