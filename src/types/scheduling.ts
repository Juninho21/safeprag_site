export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  service?: string;
  observations?: string;
  status: 'scheduled' | 'inProgress' | 'completed';
  createdAt: string;
  updatedAt: string;
  startTime: string | null;
  contact?: string;
}

export interface SchedulingFilters {
  startDate?: string;
  endDate?: string;
  status?: 'scheduled' | 'inProgress' | 'completed';
  technician?: string;
}
