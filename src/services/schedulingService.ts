import { Client, SchedulingFilters } from '../types/scheduling';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@safeprag:schedules';

const getStoredSchedules = (): Client[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setStoredSchedules = (schedules: Client[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
};

export const schedulingService = {
  async createSchedule(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'startTime'>) {
    try {
      const now = new Date().toISOString();
      const newSchedule: Client = {
        ...clientData,
        id: uuidv4(),
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
        startTime: null
      };

      const currentSchedules = getStoredSchedules();
      setStoredSchedules([...currentSchedules, newSchedule]);
      
      return newSchedule.id;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  async updateScheduleStatus(scheduleId: string, status: Client['status'], startTime?: string) {
    try {
      const schedules = getStoredSchedules();
      const updatedSchedules = schedules.map(schedule => 
        schedule.id === scheduleId
          ? { ...schedule, status, updatedAt: new Date().toISOString(), startTime: startTime || schedule.startTime }
          : schedule
      );

      setStoredSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  },

  async getSchedules(filters?: SchedulingFilters) {
    try {
      let schedules = getStoredSchedules();

      if (filters) {
        schedules = schedules.filter(schedule => {
          let match = true;

          if (filters.status && schedule.status !== filters.status) {
            match = false;
          }

          if (filters.startDate && new Date(schedule.date) < new Date(filters.startDate)) {
            match = false;
          }

          if (filters.endDate && new Date(schedule.date) > new Date(filters.endDate)) {
            match = false;
          }

          if (filters.technician && schedule.technician !== filters.technician) {
            match = false;
          }

          return match;
        });
      }

      // Ordenar por data
      return schedules.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }
};
