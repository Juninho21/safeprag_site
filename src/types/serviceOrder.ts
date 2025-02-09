export interface Product {
  name: string;
  activeIngredient: string;
  chemicalGroup: string;
  registration: string;
  batch: string;
  validity: string;
  quantity: string;
  dilution: string;
}

export interface ServiceOrder {
  id: string;
  scheduleId: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  serviceType: string;
  date: string;
  startTime: string;
  serviceStartTime: string;
  endTime: string;
  status: 'in_progress' | 'completed' | 'cancelled' | 'approved';
  createdAt: string;
  updatedAt: string;
  notes: string;
  controladorName: string; // Nome do controlador de pragas
  signatures: {
    client: string;
    technician: string;
  };
  product?: Product;
}
