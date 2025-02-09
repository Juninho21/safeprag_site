import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getFirestore
} from 'firebase/firestore';

export interface Schedule {
  clientName: string;
  clientAddress: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  technician: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const db = getFirestore();
const schedulesCollection = collection(db, 'schedules');

export const getServiceSchedulesByDate = async (date: string): Promise<Schedule[]> => {
  try {
    const q = query(
      schedulesCollection,
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    const schedules: Schedule[] = [];

    querySnapshot.forEach((doc) => {
      schedules.push(doc.data() as Schedule);
    });

    return schedules.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
};

export const addServiceSchedule = async (schedule: Schedule): Promise<void> => {
  try {
    await addDoc(schedulesCollection, {
      ...schedule,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao adicionar agendamento:', error);
    throw error;
  }
};

export const updateServiceSchedule = async (scheduleId: string, updates: Partial<Schedule>): Promise<void> => {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await updateDoc(scheduleRef, updates);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};
