import { v4 as uuidv4 } from 'uuid';
import { ServiceOrder } from '../types/serviceOrder';
import { Schedule } from '../types/schedule';
import { STORAGE_KEYS } from './storageKeys';

const MAX_AGE_DAYS = 30;

// Função para verificar se existe uma OS em andamento
export const hasActiveServiceOrder = (): boolean => {
  console.log('Verificando se existe OS em andamento...');
  
  // Primeiro, limpa ordens antigas
  cleanupServiceOrders();
  
  const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
  if (!savedOrders) {
    console.log('Nenhuma OS encontrada');
    return false;
  }

  const orders: ServiceOrder[] = JSON.parse(savedOrders);
  console.log('Total de ordens:', orders.length);
  
  // Filtra apenas ordens do dia atual
  const today = new Date().toISOString().split('T')[0];
  const activeOrders = orders.filter(order => {
    const orderDate = order.date;
    return orderDate === today && order.status === 'in_progress';
  });

  console.log('Ordens ativas hoje:', activeOrders);
  return activeOrders.length > 0;
};

// Verifica se um agendamento específico já está em andamento
export const hasActiveSchedule = (scheduleId: string): boolean => {
  console.log('Verificando se o agendamento está em andamento:', scheduleId);
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      console.log('Nenhuma OS encontrada');
      return false;
    }

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const hasActive = orders.some(
      order => order.scheduleId === scheduleId && order.status === 'in_progress'
    );
    console.log('Agendamento em andamento:', hasActive);
    return hasActive;
  } catch (error) {
    console.error('Erro ao verificar agendamento em andamento:', error);
    return false;
  }
};

// Função para obter todas as ordens de serviço
export const getAllServiceOrders = (): ServiceOrder[] => {
  try {
    console.log('Buscando todas as ordens de serviço...');
    
    // Verificar uso do localStorage
    const storageUsage = checkLocalStorageUsage();
    if (storageUsage && storageUsage.total > 4) {
      console.warn('Atenção: localStorage está usando mais de 4MB');
      cleanupStorageIfNeeded();
    }
    
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      console.log('Nenhuma ordem encontrada no localStorage');
      return [];
    }
    
    const orders = JSON.parse(savedOrders);
    console.log(`Encontradas ${orders.length} ordens de serviço:`, orders);
    
    // Se houver muitas ordens, manter apenas as mais recentes
    if (orders.length > 100) {
      console.warn('Muitas ordens encontradas, mantendo apenas as 100 mais recentes');
      const sortedOrders = orders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const recentOrders = sortedOrders.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(recentOrders));
      return recentOrders;
    }
    
    return orders;
  } catch (error) {
    console.error('Erro ao obter ordens de serviço:', error);
    return [];
  }
};

// Função para obter todas as ordens de serviço
export const getServiceOrders = (): ServiceOrder[] => {
  try {
    // Limpar ordens antigas antes de retornar
    cleanupServiceOrders();
    
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      console.log('Nenhuma ordem encontrada após limpeza');
      return [];
    }

    const orders = JSON.parse(savedOrders);
    console.log(`Retornando ${orders.length} ordens de serviço após limpeza`);
    return orders;
  } catch (error) {
    console.error('Erro ao obter ordens de serviço após limpeza:', error);
    return [];
  }
};

// Função para obter o próximo número de OS
const getNextOSNumber = (): number => {
  const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
  if (!savedOrders) return 1;

  const orders: ServiceOrder[] = JSON.parse(savedOrders);
  const maxId = orders.reduce((max, order) => {
    const orderId = parseInt(order.id);
    return isNaN(orderId) ? max : Math.max(max, orderId);
  }, 0);

  return maxId + 1;
};

// Função para criar uma nova OS
export const createServiceOrder = (schedule: Schedule): ServiceOrder => {
  try {
    // Obter o nome do controlador atual
    const savedData = localStorage.getItem('userData');
    if (!savedData) {
      throw new Error('Dados do controlador não encontrados. Por favor, verifique a aba assinaturas.');
    }

    const userData = JSON.parse(savedData);
    const controladorName = userData.name;

    if (!controladorName) {
      throw new Error('Nome do controlador não encontrado. Por favor, verifique a aba assinaturas.');
    }

    console.log('Dados do controlador ao criar OS:', {
      name: controladorName,
      signatureType: userData.signatureType
    });

    const order: ServiceOrder = {
      id: schedule.id,
      scheduleId: schedule.id,
      clientId: schedule.clientId,
      clientName: schedule.clientName,
      clientBranch: schedule.clientBranch || schedule.clientName,
      clientAddress: schedule.clientAddress || '',
      serviceType: schedule.serviceType || '',
      date: schedule.date,
      startTime: schedule.startTime || '',
      serviceStartTime: '',
      endTime: '',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
      controladorName,
      signatures: {
        client: '',
        technician: ''
      },
      product: undefined
    };

    console.log('Nova ordem criada:', {
      id: order.id,
      controladorName: order.controladorName,
      createdAt: order.createdAt
    });

    // Salvar a ordem
    saveServiceOrder(order);

    return order;
  } catch (error) {
    console.error('Erro ao criar ordem:', error);
    throw error;
  }
};

// Função para registrar não atendimento
export const registerNoService = (schedule: Schedule, reason: string): ServiceOrder => {
  try {
    const now = new Date().toISOString();
    
    const serviceOrder: ServiceOrder = {
      id: uuidv4(),
      scheduleId: schedule.id,
      clientId: schedule.clientId,
      clientName: schedule.clientName,
      clientAddress: schedule.clientAddress,
      startTime: '',
      endTime: '',
      date: schedule.date,
      status: 'cancelled',
      noServiceReason: reason,
      createdAt: now,
      updatedAt: now
    };

    // Carrega as OS existentes
    const allOrders = getAllServiceOrders();
    
    // Adiciona a nova OS
    allOrders.push(serviceOrder);
    
    // Salva no localStorage
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(allOrders));

    // Atualiza o status do agendamento
    updateScheduleStatus(schedule.id, 'cancelled');

    return serviceOrder;
  } catch (error) {
    console.error('Erro ao registrar não atendimento:', error);
    throw new Error('Erro ao registrar não atendimento');
  }
};

// Função para finalizar uma ordem de serviço
export const finishServiceOrder = async (orderId: string): Promise<void> => {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      throw new Error('Nenhuma ordem de serviço encontrada');
    }

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Ordem de serviço não encontrada');
    }

    // Verifica se o campo tratamento está preenchido quando necessário
    const order = orders[orderIndex];
    const treatmentTypes = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_gel'];
    if (treatmentTypes.includes(order.serviceType.toLowerCase()) && !order.treatment) {
      throw new Error('O campo tratamento é obrigatório para este tipo de serviço');
    }

    const now = new Date();
    const formattedEndTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Atualiza o status da OS
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'completed',
      endTime: formattedEndTime,
      updatedAt: now.toISOString()
    };

    // Salva as alterações no localStorage
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));

    // Atualiza o status do agendamento para completed
    await updateScheduleStatus(orders[orderIndex].scheduleId, 'completed');

    // Dispara evento de atualização
    const event = new CustomEvent('serviceOrderUpdate', {
      detail: {
        orderId: orderId,
        scheduleId: orders[orderIndex].scheduleId,
        status: 'completed',
        endTime: formattedEndTime
      }
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Erro ao finalizar ordem de serviço:', error);
    throw error;
  }
};

// Função para finalizar todas as OS em andamento
export const finishAllActiveServiceOrders = (): void => {
  try {
    const allOrders = getAllServiceOrders();
    const now = new Date();
    const currentTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const updatedOrders = allOrders.map(order => {
      if (order.status === 'in_progress') {
        return {
          ...order,
          status: 'completed',
          endTime: currentTime,
          updatedAt: now.toISOString()
        };
      }
      return order;
    });

    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(updatedOrders));

    // Atualizar o status dos agendamentos relacionados
    updatedOrders.forEach(order => {
      if (order.status === 'completed') {
        updateScheduleStatus(order.scheduleId, 'completed');
      }
    });

    // Limpa o status dos agendamentos pendentes do dia
    clearPendingSchedules();
  } catch (error) {
    console.error('Erro ao finalizar ordens de serviço:', error);
  }
};

// Função para limpar o status dos agendamentos pendentes do dia
const clearPendingSchedules = () => {
  try {
    const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!savedSchedules) return;

    const allSchedules = JSON.parse(savedSchedules);
    const today = new Date().toISOString().split('T')[0];

    // Pega todas as OS do dia
    const allOrders = getAllServiceOrders();
    const completedOrderScheduleIds = allOrders
      .filter(order => order.status === 'completed')
      .map(order => order.scheduleId);

    const updatedSchedules = allSchedules.map((schedule: Schedule) => {
      // Só marca como concluído se for do dia atual E tiver uma OS finalizada associada
      if (schedule.date === today && completedOrderScheduleIds.includes(schedule.id)) {
        return { 
          ...schedule, 
          status: 'completed',
          updatedAt: new Date().toISOString()
        };
      }
      return schedule;
    });

    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updatedSchedules));
  } catch (error) {
    console.error('Erro ao limpar status dos agendamentos:', error);
  }
};

// Função para limpar ordens de serviço antigas ou inválidas
export const cleanupServiceOrders = () => {
  try {
    console.log('Iniciando limpeza de ordens antigas...');
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) return;

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const now = new Date();
    
    // Manter apenas ordens dos últimos MAX_AGE_DAYS dias
    const validOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const diffInDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      const isValid = diffInDays <= MAX_AGE_DAYS;
      if (!isValid) {
        console.log(`Removendo ordem antiga: ${order.id} de ${orderDate.toLocaleDateString()}`);
      }
      return isValid;
    });

    console.log(`Removidas ${orders.length - validOrders.length} ordens antigas`);
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(validOrders));
  } catch (error) {
    console.error('Erro ao limpar ordens antigas:', error);
  }
};

// Função para limpar todos os dados do sistema
export const cleanupSystemData = async (): Promise<boolean> => {
  try {
    // Limpar ordens de serviço
    localStorage.removeItem(STORAGE_KEYS.SERVICE_ORDERS);
    
    // Limpar dados da empresa
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
    
    // Limpar clientes
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    
    // Limpar produtos
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    
    // Limpar dados do usuário
    localStorage.removeItem('userData');
    
    // Dispara evento de atualização
    const event = new CustomEvent('systemCleanup');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados do sistema:', error);
    throw new Error('Falha ao limpar dados do sistema');
  }
};

// Função para atualizar o status dos agendamentos do dia
export const updateDailySchedulesStatus = async (): Promise<void> => {
  console.log('Atualizando status dos agendamentos do dia...');
  
  try {
    // Busca os agendamentos do localStorage
    const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!savedSchedules) {
      console.log('Nenhum agendamento encontrado');
      return;
    }

    const schedules: Schedule[] = JSON.parse(savedSchedules);
    
    // Pega a data atual no formato yyyy-MM-dd
    const today = new Date().toISOString().split('T')[0];
    console.log('Data atual:', today);

    // Filtra os agendamentos do dia
    const todaySchedules = schedules.filter(schedule => schedule.date === today);
    console.log('Agendamentos do dia:', todaySchedules);

    // Busca as ordens de serviço do localStorage
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    const orders: ServiceOrder[] = savedOrders ? JSON.parse(savedOrders) : [];

    // Para cada agendamento do dia
    for (const schedule of todaySchedules) {
      // Verifica se já passou do horário do agendamento
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const isPastSchedule = schedule.endTime <= currentTime;

      // Busca a ordem de serviço relacionada
      const relatedOrder = orders.find(order => order.scheduleId === schedule.id);

      if (relatedOrder) {
        // Se tem OS relacionada, usa o status dela
        if (relatedOrder.status === 'completed' && schedule.status !== 'completed') {
          await updateScheduleStatus(schedule.id, 'completed');
        } else if (relatedOrder.status === 'in_progress' && schedule.status !== 'in_progress') {
          await updateScheduleStatus(schedule.id, 'in_progress');
        }
      } else if (isPastSchedule && schedule.status === 'pending') {
        // Se não tem OS e já passou do horário, marca como não atendido
        await updateScheduleStatus(schedule.id, 'cancelled');
      }
    }

    console.log('Status dos agendamentos atualizados com sucesso');

  } catch (error) {
    console.error('Erro ao atualizar status dos agendamentos:', error);
    throw error;
  }
};

// Função para atualizar o status dos agendamentos de uma data específica
export const updateSchedulesStatusByDate = async (date: string): Promise<void> => {
  console.log('Atualizando status dos agendamentos da data:', date);
  
  try {
    // Aguarda um momento para garantir que todas as atualizações anteriores foram processadas
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Busca os agendamentos do localStorage
    const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!savedSchedules) {
      console.log('Nenhum agendamento encontrado');
      return;
    }

    const schedules: Schedule[] = JSON.parse(savedSchedules);
    
    // Filtra os agendamentos da data selecionada
    const dateSchedules = schedules.filter(schedule => schedule.date === date);
    console.log('Agendamentos da data:', dateSchedules);

    // Busca as ordens de serviço do localStorage
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    console.log('Ordens de serviço encontradas:', savedOrders);
    const orders: ServiceOrder[] = savedOrders ? JSON.parse(savedOrders) : [];
    console.log('Ordens de serviço parseadas:', orders);

    // Para cada agendamento da data
    for (const schedule of dateSchedules) {
      console.log('\nProcessando agendamento:', schedule);
      
      // Verifica se já passou do horário do agendamento
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const isPastSchedule = schedule.endTime <= currentTime;
      console.log('Horário atual:', currentTime);
      console.log('Horário do agendamento:', schedule.endTime);
      console.log('Passou do horário?', isPastSchedule);

      // Busca a ordem de serviço relacionada
      const relatedOrder = orders.find(order => {
        const isRelated = order.scheduleId === schedule.id;
        console.log('Verificando OS:', order.id, 'scheduleId:', order.scheduleId, 'relacionada?', isRelated);
        return isRelated;
      });
      console.log('Ordem de serviço relacionada:', relatedOrder);

      let newStatus = schedule.status;
      console.log('Status atual:', schedule.status);

      if (relatedOrder) {
        console.log('Status da OS:', relatedOrder.status);
        // Se tem OS relacionada, usa o status dela
        if (relatedOrder.status === 'completed') {
          console.log('OS está concluída, atualizando agendamento para concluído');
          newStatus = 'completed';
        } else if (relatedOrder.status === 'in_progress') {
          console.log('OS está em andamento, atualizando agendamento para em andamento');
          newStatus = 'in_progress';
        }
      } else if (isPastSchedule && schedule.status === 'pending') {
        console.log('Sem OS e passou do horário, marcando como não atendido');
        newStatus = 'cancelled';
      } else if (!isPastSchedule && schedule.status === 'cancelled') {
        console.log('Sem OS e ainda não passou do horário, voltando para pendente');
        newStatus = 'pending';
      }

      console.log('Novo status:', newStatus);
      // Só atualiza se o status mudou
      if (newStatus !== schedule.status) {
        console.log('Atualizando status do agendamento...');
        await updateScheduleStatus(schedule.id, newStatus);
        // Aguarda um momento para garantir que a atualização foi processada
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('Status não mudou, mantendo o mesmo');
      }
    }

    console.log('Status dos agendamentos atualizados com sucesso');

  } catch (error) {
    console.error('Erro ao atualizar status dos agendamentos:', error);
    throw error;
  }
};

// Função para atualizar o status dos agendamentos de uma data específica
export const updateScheduleStatus = (scheduleId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): void => {
  console.log(`Atualizando status do agendamento ${scheduleId} para ${status}`);
  
  // Busca os agendamentos do localStorage
  const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  if (!savedSchedules) {
    console.log('Nenhum agendamento encontrado');
    return;
  }

  try {
    const schedules = JSON.parse(savedSchedules);
    const scheduleIndex = schedules.findIndex((s: any) => s.id === scheduleId);

    if (scheduleIndex === -1) {
      console.log('Agendamento não encontrado');
      return;
    }

    const updatedSchedule = {
      ...schedules[scheduleIndex],
      status: status,
      updatedAt: new Date().toISOString()
    };

    // Atualiza o status do agendamento
    schedules[scheduleIndex] = updatedSchedule;

    // Salva os agendamentos atualizados
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    console.log('Agendamento atualizado com sucesso:', updatedSchedule);

    // Dispara evento de atualização com o agendamento completo
    const event = new CustomEvent('scheduleUpdate', {
      detail: {
        scheduleId,
        status,
        schedule: updatedSchedule,
        timestamp: new Date().toISOString()
      }
    });
    console.log('Disparando evento scheduleUpdate com detalhes:', event.detail);
    window.dispatchEvent(event);

    // Dispara evento de storage manualmente para garantir que outros componentes sejam notificados
    const storageEvent = new StorageEvent('storage', {
      key: STORAGE_KEYS.SCHEDULES,
      newValue: JSON.stringify(schedules),
      url: window.location.href
    });
    console.log('Disparando evento storage');
    window.dispatchEvent(storageEvent);

  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    throw error;
  }
};

// Função para aprovar uma ordem de serviço
export const approveServiceOrder = async (orderId: string): Promise<void> => {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      throw new Error('Nenhuma ordem de serviço encontrada');
    }

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Ordem de serviço não encontrada');
    }

    const now = new Date();

    // Atualiza o status da OS
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'approved',
      updatedAt: now.toISOString()
    };

    // Salva as alterações no localStorage
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));

    // Dispara evento de atualização
    const event = new CustomEvent('serviceOrderUpdate', {
      detail: {
        orderId: orderId,
        status: 'approved'
      }
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Erro ao aprovar ordem de serviço:', error);
    throw error;
  }
};

// Função para obter todas as ordens de serviço finalizadas
export const getFinishedServiceOrders = (): ServiceOrder[] => {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    if (!savedOrders) {
      return [];
    }

    const orders: ServiceOrder[] = JSON.parse(savedOrders);
    // Filtra ordens finalizadas (que têm endTime e status completed ou approved)
    const finishedOrders = orders.filter(order => 
      order.endTime && (order.status === 'completed' || order.status === 'approved')
    );
    
    // Ordena por data de finalização, mais recentes primeiro
    return finishedOrders.sort((a, b) => {
      const dateA = new Date(a.endTime || 0).getTime();
      const dateB = new Date(b.endTime || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erro ao obter ordens finalizadas:', error);
    return [];
  }
};

// Função para salvar uma ordem de serviço
export const saveServiceOrder = (order: ServiceOrder): void => {
  try {
    // Garantir que o controladorName está definido
    if (!order.controladorName) {
      const savedData = localStorage.getItem('userData');
      if (!savedData) {
        throw new Error('Dados do controlador não encontrados. Por favor, verifique a aba assinaturas.');
      }

      const userData = JSON.parse(savedData);
      const controladorName = userData.name;

      if (!controladorName) {
        throw new Error('Nome do controlador não encontrado. Por favor, verifique a aba assinaturas.');
      }

      order.controladorName = controladorName;
    }

    console.log('Salvando ordem:', {
      id: order.id,
      controladorName: order.controladorName,
      createdAt: order.createdAt
    });

    const existingOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
    let orders: ServiceOrder[] = existingOrders ? JSON.parse(existingOrders) : [];
    
    // Se a ordem já existe, atualiza
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
    } else {
      orders.push(order);
    }

    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error('Erro ao salvar ordem:', error);
    throw error;
  }
};

// Função para verificar uso do localStorage
export const checkLocalStorageUsage = (): { total: number } => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length * 2) / 1024 / 1024; // Tamanho em MB
    }
  }
  return { total };
};

// Função para limpar localStorage se necessário
export const cleanupStorageIfNeeded = (): void => {
  const { total } = checkLocalStorageUsage();
  if (total > 8) { // Aumentando o limite para 8MB
    console.warn('Limpeza seletiva do localStorage necessária');
    
    // Manter ordens de serviço dos últimos 90 dias
    const orders = getAllServiceOrders();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= ninetyDaysAgo;
    });
    
    // Salvar apenas as ordens recentes
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(recentOrders));
    
    // Limpar outros dados temporários se necessário
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && 
          !key.includes('SERVICE_ORDERS') && 
          !key.includes('userData') &&
          !key.includes('companyData')) {
        localStorage.removeItem(key);
      }
    }
  }
};
