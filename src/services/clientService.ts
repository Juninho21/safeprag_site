import { 
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  orderBy,
  limit
} from 'firebase/firestore';

export interface Client {
  id?: string;
  code: string;
  name: string;
  address: string;
  branch: string;
  document: string;
  contact: string;
  phone: string;
}

const CLIENTS_STORAGE_KEY = 'clients';
const CLIENT_CODE_COUNTER_KEY = 'safeprag_client_code_counter';

// Função para gerar o próximo código de cliente
const generateNextClientCode = (): string => {
  // Buscar o último código usado
  const lastCounter = localStorage.getItem(CLIENT_CODE_COUNTER_KEY) || '0';
  const nextCounter = parseInt(lastCounter, 10) + 1;
  
  // Salvar o novo contador
  localStorage.setItem(CLIENT_CODE_COUNTER_KEY, nextCounter.toString());
  
  // Formatar o código (C + 5 dígitos com zeros à esquerda)
  const code = `C${nextCounter.toString().padStart(5, '0')}`;
  console.log('Código gerado:', code);
  return code;
};

// Função para buscar todos os clientes
export const getClients = (): Client[] => {
  const clientsData = localStorage.getItem(CLIENTS_STORAGE_KEY);
  const clients = clientsData ? JSON.parse(clientsData) : [];
  console.log('Clientes carregados:', clients);
  return clients;
};

// Função para salvar um cliente
export const saveClient = (clientData: Omit<Client, 'code'>): Client => {
  const clients = getClients();
  const newClient: Client = {
    ...clientData,
    code: generateNextClientCode()
  };
  
  clients.push(newClient);
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  console.log('Cliente salvo:', newClient);
  
  return newClient;
};

// Função para deletar um cliente
export const deleteClient = (code: string): void => {
  const clients = getClients();
  const updatedClients = clients.filter(client => client.code !== code);
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
  console.log('Cliente removido:', code);
};

// Função para buscar clientes
export const searchClients = (searchTerm: string): Client[] => {
  const clients = getClients();
  if (!searchTerm) return clients;

  const normalizedSearch = searchTerm.toLowerCase();
  return clients.filter(client => 
    client.name.toLowerCase().includes(normalizedSearch) ||
    client.code.toLowerCase().includes(normalizedSearch) ||
    client.document.toLowerCase().includes(normalizedSearch)
  );
};

// Função para atualizar um cliente
export const updateClient = (code: string, updatedData: Partial<Client>): Client | null => {
  const clients = getClients();
  const clientIndex = clients.findIndex(client => client.code === code);
  
  if (clientIndex === -1) {
    console.error('Cliente não encontrado:', code);
    return null;
  }
  
  const updatedClient = {
    ...clients[clientIndex],
    ...updatedData
  };
  
  clients[clientIndex] = updatedClient;
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  console.log('Cliente atualizado:', updatedClient);
  
  return updatedClient;
};
