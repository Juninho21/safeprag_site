import { Device } from '../types';
import { STORAGE_KEYS } from './storageKeys';

const getStringSizeInMB = (str: string): number => {
  const bytes = new Blob([str]).size;
  return bytes / (1024 * 1024);
};

export const checkLocalStorageUsage = () => {
  try {
    let totalSize = 0;
    let usage = {};

    Object.keys(localStorage).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        const size = getStringSizeInMB(item);
        totalSize += size;
        usage[key] = {
          size: size.toFixed(2) + ' MB',
          items: key === STORAGE_KEYS.SERVICE_ORDERS ? 
            JSON.parse(item).length : 
            (key === STORAGE_KEYS.PRODUCTS ? JSON.parse(item).length : 1)
        };
      }
    });

    console.log('Uso do localStorage:', {
      total: totalSize.toFixed(2) + ' MB',
      detalhes: usage
    });

    return {
      total: totalSize,
      usage
    };
  } catch (error) {
    console.error('Erro ao verificar uso do localStorage:', error);
    return null;
  }
};

export const cleanupStorageIfNeeded = () => {
  const usage = checkLocalStorageUsage();
  if (!usage) return;

  if (usage.total > 4) {
    console.warn('localStorage próximo do limite, iniciando limpeza...');
    
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS) || '[]');
      if (orders.length > 100) {
        const sortedOrders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const recentOrders = sortedOrders.slice(0, 100);
        localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(recentOrders));
        console.log(`Removidas ${orders.length - recentOrders.length} ordens antigas`);
      }
    } catch (error) {
      console.error('Erro ao limpar ordens antigas:', error);
    }
  }
};

export const storageService = {
  // Devices
  saveDevices: (devices: Device[]) => {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  },

  getDevices: (): Device[] => {
    const devices = localStorage.getItem(STORAGE_KEYS.DEVICES);
    return devices ? JSON.parse(devices) : [];
  },

  // Service Orders
  saveServiceOrders: (orders: any[]) => {
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));
  },

  getServiceOrders: (): any[] => {
    const orders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    return orders ? JSON.parse(orders) : [];
  },

  // Products
  saveProducts: (products: any[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getProducts: (): any[] => {
    const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : [];
  },

  // Clear all data
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.DEVICES);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  }
};
