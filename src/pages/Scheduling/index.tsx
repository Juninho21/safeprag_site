import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, Mail, User, FileText, Plus, X, Play, Package, Check, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Client, SchedulingFilters } from '../../types/scheduling';
import { schedulingService } from '../../services/schedulingService';
import { NewScheduleModal } from './NewScheduleModal';

export function SchedulingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityPageOpen, setIsActivityPageOpen] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [filters, setFilters] = useState<SchedulingFilters>({});
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [endTime, setEndTime] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [filters]);

  useEffect(() => {
    if (isActivityPageOpen) {
      loadSchedules();
    }
  }, [isActivityPageOpen]);

  async function loadSchedules() {
    try {
      const data = await schedulingService.getSchedules(filters);
      setClients(data);
      
      if (isActivityPageOpen && selectedClient) {
        const updatedSelectedClient = data.find(client => client.id === selectedClient.id);
        if (updatedSelectedClient) {
          setSelectedClient(updatedSelectedClient);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
    }
  }

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleStartService = async () => {
    if (!selectedClient) return;

    try {
      const now = new Date();
      const formattedStartTime = format(now, 'HH:mm', { locale: ptBR });
      
      // Atualiza o serviço com o horário de início
      await schedulingService.updateScheduleStatus(selectedClient.id, 'inProgress', formattedStartTime);
      
      // Atualiza o estado local
      setStartTime(formattedStartTime);
      setSelectedClient(prev => prev ? {
        ...prev,
        status: 'inProgress',
        startTime: formattedStartTime
      } : null);
      
      setIsModalOpen(false);
      setIsActivityPageOpen(true);
      
      // Recarrega os dados
      await loadSchedules();
    } catch (error) {
      toast.error('Erro ao iniciar serviço');
    }
  };

  const loadClientData = async (clientId: string) => {
    try {
      const client = await schedulingService.getScheduleById(clientId);
      if (client) {
        setSelectedClient(client);
        setStartTime(client.startTime || null);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do cliente');
    }
  };

  useEffect(() => {
    if (isActivityPageOpen && selectedClient) {
      loadClientData(selectedClient.id);
    }
  }, [isActivityPageOpen]);

  useEffect(() => {
    if (selectedClient) {
      setStartTime(selectedClient.startTime || null);
    }
  }, [selectedClient]);

  const handleFinishService = async () => {
    if (!selectedClient) return;

    try {
      const now = new Date();
      setEndTime(format(now, 'HH:mm', { locale: ptBR }));

      await schedulingService.updateScheduleStatus(selectedClient.id, 'completed');
      
      setSelectedClient(prev => prev ? { ...prev, status: 'completed' } : null);
      
      setIsActivityPageOpen(false);
      
      await loadSchedules();
      
      toast.success('Serviço finalizado com sucesso!');

      // Gera relatório ou ordem de serviço se necessário
      // TODO: Implementar geração de relatório
    } catch (error) {
      toast.error('Erro ao finalizar serviço');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Agendamentos</h1>
        <button
          onClick={() => setIsNewScheduleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="form-select"
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as Client['status'] }))}
            value={filters.status || ''}
          >
            <option value="">Todos os status</option>
            <option value="scheduled">Agendado</option>
            <option value="inProgress">Em andamento</option>
            <option value="completed">Concluído</option>
          </select>

          <input
            type="date"
            className="form-input"
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
            value={filters.startDate || ''}
          />

          <input
            type="date"
            className="form-input"
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
            value={filters.endDate || ''}
          />
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <motion.div
            key={client.id}
            whileHover={{ scale: 1.02 }}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer
              ${client.status === 'completed' ? 'opacity-75' : ''}`}
            onClick={() => handleClientClick(client)}
          >
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold">{client.name}</h2>
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(new Date(client.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>

              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{client.time}</span>
              </div>

              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{client.address}</span>
              </div>

              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                  ${client.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  client.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}`}
                >
                  {client.status === 'scheduled' ? 'Agendado' :
                   client.status === 'inProgress' ? 'Em andamento' :
                   'Concluído'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Ações do Agendamento</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Dados do Cliente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>{selectedClient.name}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <span className="flex-1">{selectedClient.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>Contato: {selectedClient.contact || 'Não informado'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{selectedClient.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>Horário: {selectedClient.time}</span>
                  </div>

                  {selectedClient.status === 'inProgress' && (
                    <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Em Andamento
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  onClick={handleStartService}
                  disabled={selectedClient.status !== 'scheduled'}
                >
                  <Play className="w-5 h-5" />
                  Iniciar OS
                </button>

                <button
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  onClick={() => {
                    // Implementar função de não atendimento
                    toast.info('Funcionalidade em desenvolvimento');
                  }}
                >
                  <X className="w-5 h-5" />
                  Registrar Não Atendimento
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Página de Atividade */}
      {isActivityPageOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4"
          >
            <h2 className="text-2xl font-bold mb-6">Ordem de Serviço</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Serviço *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione o tipo de serviço</option>
                  <option value="dedetizacao">Dedetização</option>
                  <option value="desratizacao">Desratização</option>
                  <option value="sanitizacao">Sanitização</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Praga Alvo *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione a praga alvo</option>
                  <option value="baratas">Baratas</option>
                  <option value="ratos">Ratos</option>
                  <option value="formigas">Formigas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local *
                </label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Selecione o local</option>
                  <option value="interno">Área Interna</option>
                  <option value="externo">Área Externa</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foram utilizados produtos?
                </label>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-blue-600">Produtos Utilizados</span>
                  <button className="ml-auto text-blue-600">
                    Selecione um produto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  placeholder="Digite as observações aqui..."
                />
              </div>

              <div className="text-sm text-blue-600">
                OS em andamento - Iniciada às {selectedClient.startTime || startTime}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  onClick={handleFinishService}
                >
                  <Check className="w-5 h-5" />
                  Finalizar OS
                </button>
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Aprovar OS
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Novo Agendamento */}
      {isNewScheduleModalOpen && (
        <NewScheduleModal
          onClose={() => setIsNewScheduleModalOpen(false)}
          onSuccess={loadSchedules}
        />
      )}
    </div>
  );
}
