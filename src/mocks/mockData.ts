export interface Client {
  code: string;
  name: string;
  address: string;
  branch: string;
  document: string;
  contact: string;
  phone: string;
}

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

// Mock de clientes para busca
export const mockClients: Client[] = [
  {
    code: 'C001',
    name: 'Empresa ABC Ltda',
    address: 'Rua Principal, 123 - Centro',
    branch: 'Matriz',
    document: '12.345.678/0001-90',
    contact: 'João Silva',
    phone: '(11) 99999-8888'
  },
  {
    code: 'C002',
    name: 'Supermercado XYZ',
    address: 'Av. Comercial, 456 - Vila Nova',
    branch: 'Filial',
    document: '98.765.432/0001-21',
    contact: 'Maria Santos',
    phone: '(11) 97777-6666'
  },
  {
    code: 'C003',
    name: 'Restaurante Sabor & Cia',
    address: 'Rua das Flores, 789 - Jardim',
    branch: 'Único',
    document: '45.678.901/0001-23',
    contact: 'Pedro Oliveira',
    phone: '(11) 96666-5555'
  }
];

// Mock de agendamentos
export const mockSchedules: Schedule[] = [
  {
    clientName: 'Empresa ABC Ltda',
    clientAddress: 'Rua Principal, 123 - Centro',
    serviceType: 'Dedetização',
    date: '2024-01-20',
    time: '09:00',
    duration: '2 horas',
    technician: 'João Silva',
    notes: 'Cliente solicitou atenção especial na área da cozinha',
    status: 'confirmed'
  },
  {
    clientName: 'Supermercado XYZ',
    clientAddress: 'Av. Comercial, 456 - Vila Nova',
    serviceType: 'Desratização',
    date: '2024-01-20',
    time: '14:00',
    duration: '3 horas',
    technician: 'Maria Santos',
    notes: 'Necessário acesso ao depósito',
    status: 'pending'
  }
];

// Função para buscar clientes mockados
export const searchMockClients = (searchTerm: string): Client[] => {
  if (!searchTerm) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return mockClients.filter(client => 
    client.name.toLowerCase().includes(lowerSearchTerm) ||
    client.code.toLowerCase().includes(lowerSearchTerm)
  );
};

// Função para buscar agendamentos mockados por data
export const getMockSchedulesByDate = (date: string): Schedule[] => {
  return mockSchedules.filter(schedule => schedule.date === date);
};
