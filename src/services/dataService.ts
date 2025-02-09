import { storageService } from './storageService';

// Tipos
interface CompanyData {
  name: string;
  document: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

interface Client {
  id: string;
  name: string;
  document: string;
  address: string;
  phone: string;
  email: string;
}

// Keys para localStorage
const STORAGE_KEYS = {
  COMPANY: 'safeprag_company',
  CLIENTS: 'safeprag_clients',
};

// Serviço de Empresa
export const companyService = {
  getCompany: (): CompanyData | null => {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return data ? JSON.parse(data) : null;
  },

  saveCompany: (data: CompanyData): void => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(data));
  },

  deleteCompany: (): void => {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
  }
};

// Serviço de Clientes
export const clientService = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },

  saveClient: (client: Client): void => {
    const clients = clientService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  deleteClient: (id: string): void => {
    const clients = clientService.getClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
  },

  searchClients: (query: string): Client[] => {
    const clients = clientService.getClients();
    const searchTerm = query.toLowerCase();
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      client.document.toLowerCase().includes(searchTerm)
    );
  }
};
