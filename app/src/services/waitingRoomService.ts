// ============================================================
// Veterinaria La Plata — Waiting Room Queue Service
// ============================================================
export interface QueueItem {
  id: string;
  ticketNumber: string; // e.g., "A-01", "A-02"
  petName: string;
  ownerName: string;
  reason: string; // e.g., "Consulta Clínica", "Vacunación", "Peluquería"
  doctorOrRoom?: string; // e.g., "Consultorio 1 (Dr. Fernández)"
  arrivalTime: Date;
  status: 'waiting' | 'calling' | 'in_consultation' | 'completed';
}

export let MOCK_QUEUE: QueueItem[] = [
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

let ticketCounter = 4;

export const getQueue = async (): Promise<QueueItem[]> => {
  return MOCK_QUEUE;
};

export const addToQueue = async (
  petName: string,
  ownerName: string,
  reason: string,
  doctorOrRoom?: string
): Promise<QueueItem> => {
  const newNum = ticketCounter < 10 ? `A-0${ticketCounter}` : `A-${ticketCounter}`;
  ticketCounter++;

  const newItem: QueueItem = {
    id: `q-${Date.now()}`,
    ticketNumber: newNum,
    petName,
    ownerName,
    reason,
    doctorOrRoom: doctorOrRoom || 'Consultorio 1',
    arrivalTime: new Date(),
    status: 'waiting',
  };

  MOCK_QUEUE = [...MOCK_QUEUE, newItem];
  return newItem;
};

export const updateQueueStatus = async (
  id: string,
  status: QueueItem['status'],
  doctorOrRoom?: string
): Promise<QueueItem | null> => {
  const item = MOCK_QUEUE.find(q => q.id === id);
  if (item) {
    item.status = status;
    if (doctorOrRoom) item.doctorOrRoom = doctorOrRoom;
    return item;
  }
  return null;
};

export const removeFromQueue = async (id: string): Promise<void> => {
  MOCK_QUEUE = MOCK_QUEUE.filter(q => q.id !== id);
};
