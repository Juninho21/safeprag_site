export interface Client {
  id: string;
  code: string;
  name: string;
  address: string;
  document: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface Schedule {
  id: string;
  clientId: string;
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

// Função para buscar todos os clientes ativos
export const getActiveClients = (): Client[] => {
  try {
    const clientsJson = localStorage.getItem('clients');
    if (!clientsJson) return [];
    
    const allClients = JSON.parse(clientsJson) as Client[];
    return allClients.filter(client => client.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
};

// Função para buscar agendamentos por data
export const getSchedulesByDate = (date: string): Schedule[] => {
  try {
    const schedulesJson = localStorage.getItem('schedules');
    if (!schedulesJson) return [];
    
    const allSchedules = JSON.parse(schedulesJson) as Schedule[];
    return allSchedules
      .filter(schedule => schedule.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
};

// Função para salvar um novo agendamento
export const saveSchedule = (schedule: Omit<Schedule, 'id'>): Schedule => {
  try {
    const schedulesJson = localStorage.getItem('schedules');
    const schedules = schedulesJson ? JSON.parse(schedulesJson) as Schedule[] : [];
    
    const newSchedule: Schedule = {
      ...schedule,
      id: Date.now().toString() // Gera um ID único baseado no timestamp
    };
    
    schedules.push(newSchedule);
    localStorage.setItem('schedules', JSON.stringify(schedules));
    
    return newSchedule;
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    throw new Error('Não foi possível salvar o agendamento');
  }
};
