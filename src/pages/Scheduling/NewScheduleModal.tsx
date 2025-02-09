import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { schedulingService } from '../../services/schedulingService';

interface NewScheduleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewScheduleModal({ onClose, onSuccess }: NewScheduleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    date: '',
    time: '',
    address: '',
    phone: '',
    email: '',
    observations: '',
    technician: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await schedulingService.createSchedule(formData);
      toast.success('Agendamento criado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Novo Agendamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serviço
              </label>
              <select
                name="service"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="">Selecione um serviço</option>
                <option value="Dedetização">Dedetização</option>
                <option value="Desratização">Desratização</option>
                <option value="Descupinização">Descupinização</option>
                <option value="Sanitização">Sanitização</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário
              </label>
              <input
                type="time"
                name="time"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.time}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full p-2 border rounded-lg"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Técnico Responsável
              </label>
              <input
                type="text"
                name="technician"
                className="w-full p-2 border rounded-lg"
                value={formData.technician}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="observations"
                rows={3}
                className="w-full p-2 border rounded-lg"
                value={formData.observations}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar Agendamento
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
