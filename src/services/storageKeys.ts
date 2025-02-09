// Chaves usadas para armazenamento no localStorage
export const STORAGE_KEYS = {
  COMPANY: 'safeprag_company_data',
  CLIENTS: 'safeprag_clients',
  PRODUCTS: 'safeprag_products',
  SCHEDULES: 'safeprag_schedules',
  SETTINGS: 'safeprag_settings',
  SERVICE_ORDERS: 'safeprag_service_orders',
  SIGNATURES: {
    TECHNICIAN: 'userData', // Chave onde são salvas as assinaturas do controlador e técnico
    CLIENT: 'client_signature_data', // Chave onde é salva a assinatura do cliente
    SUPERVISOR: 'supervisor_assinatura'
  }
} as const;

// Função para limpar todos os dados do localStorage
export const clearAllData = () => {
  // Limpa as chaves principais
  Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      localStorage.removeItem(value);
    } else if (typeof value === 'object') {
      // Limpa as sub-chaves (como assinaturas)
      Object.values(value).forEach(subKey => {
        localStorage.removeItem(subKey);
      });
    }
  });
};

// Função para verificar se há dados salvos
export const hasStoredData = (key: string): boolean => {
  if (key in STORAGE_KEYS) {
    const value = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
    if (typeof value === 'string') {
      return localStorage.getItem(value) !== null;
    } else if (typeof value === 'object') {
      // Verifica se há alguma assinatura salva
      return Object.values(value).some(subKey => localStorage.getItem(subKey) !== null);
    }
  }
  return false;
};

// Função para fazer backup de todos os dados
export const backupAllData = (): Record<string, any> => {
  const backup: Record<string, any> = {};
  
  // Backup dos dados principais
  Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const data = localStorage.getItem(value);
      if (data) {
        try {
          backup[key] = JSON.parse(data);
        } catch (error) {
          console.error(`Erro ao fazer parse dos dados de ${key}:`, error);
          backup[key] = data; // Salva como string se não for JSON
        }
      }
    } else if (typeof value === 'object') {
      // Backup das assinaturas
      backup[key] = {};
      Object.entries(value).forEach(([subKey, storageKey]) => {
        const data = localStorage.getItem(storageKey);
        if (data) {
          try {
            backup[key][subKey] = JSON.parse(data);
          } catch (error) {
            console.error(`Erro ao fazer parse dos dados de ${key}.${subKey}:`, error);
            backup[key][subKey] = data; // Salva como string se não for JSON
          }
        }
      });
    }
  });
  
  return backup;
};

// Função para restaurar backup
export const restoreBackup = (backup: Record<string, any>) => {
  Object.entries(backup).forEach(([key, data]) => {
    const value = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
    
    if (typeof value === 'string') {
      // Restaura dados principais
      localStorage.setItem(value, JSON.stringify(data));
    } else if (typeof value === 'object' && typeof data === 'object') {
      // Restaura assinaturas
      Object.entries(data).forEach(([subKey, subData]) => {
        const storageKey = value[subKey];
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(subData));
        }
      });
    }
  });
};
