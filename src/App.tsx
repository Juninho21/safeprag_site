import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { 
  Calendar, 
  Settings,
  ClipboardList,
  Activity,
  Download,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import { ServiceScheduler } from './components/ServiceScheduler';
import { BottomNavBar } from './components/BottomNavBar';
import { AdminPage } from './components/AdminPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationToast } from './components/NotificationToast';
import { KeepAliveProvider } from './contexts/KeepAliveContext';
import { useNotification } from './contexts/NotificationContext';
import { ApprovalModal } from './components/ApprovalModal';
import ServiceActivity from './components/ServiceActivity';
import { storageService } from './services/storageService';
import { generateServiceOrderPDF } from './services/pdfService';
import { getActiveServiceOrder, approveServiceOrder, updateScheduleStatus } from './services/ordemServicoService';

interface State {
  selectedDevice: string;
  selectedStatus: string;
  quantity: string;
  devices: Array<{
    id: string;
    type: string;
    status: string;
    quantity?: string;
  }>;
  savedDevices: Array<{
    id: string;
    type: string;
    status: string;
    quantity?: string;
  }>;
  isLoading: boolean;
  startTime: Date | null;
  endTime: Date | null;
  selectedProduct: {
    name: string;
    activeIngredient: string;
    chemicalGroup: string;
    registration: string;
    batch: string;
    validity: string;
    quantity: string;
    dilution: string;
  } | null;
  serviceOrders: Array<{
    id: string;
    createdAt: string;
    updatedAt: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'approved';
    devices: Array<{
      id: string;
      type: string;
      status: string;
      quantity?: string;
    }>;
    pdfUrl: string;
    client: {
      code: string;
      name: string;
      address: string;
    };
  }>;
  observations: string;
  location: string;
  selectedOs: any;
  counter: number;
  currentPage: string;
}

interface Product {
  name: string;
  activeIngredient: string;
  chemicalGroup: string;
  registration: string;
  batch: string;
  validity: string;
  quantity: string;
  dilution: string;
}

type Action =
  | { type: 'SET_DEVICE'; payload: string }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_QUANTITY'; payload: string }
  | { type: 'SET_DEVICES'; payload: Array<{
    id: string;
    type: string;
    status: string;
    quantity?: string;
  }> }
  | { type: 'UPDATE_DEVICE'; payload: { id: string; status: string | null } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SAVE_DEVICES' }
  | { type: 'CLEAR_CURRENT' }
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SET_SELECTED_PRODUCT'; payload: Product }
  | { 
      type: 'ADD_SERVICE_ORDER'; 
      payload: { 
        devices: Array<{
          id: string;
          type: string;
          status: string;
          quantity?: string;
        }>;
        pdfUrl: string;
        client: {
          code: string;
          name: string;
          address: string;
        };
        service: {
          type: string;
          target: string;
          location: string;
        };
        product: Product;
        observations: string;
        startTime: string;
        endTime: string;
        signatures: {
          serviceResponsible: string;
          technicalResponsible: string;
          clientRepresentative: string;
        };
      } 
    }
  | { type: 'SET_START_TIME'; payload: Date }
  | { type: 'SET_END_TIME'; payload: Date };

const initialState: State = {
  selectedDevice: '',
  selectedStatus: '',
  quantity: '',
  devices: [],
  savedDevices: [],
  isLoading: false,
  startTime: null,
  endTime: null,
  selectedProduct: null,
  serviceOrders: [],
  observations: '',
  location: '',
  selectedOs: null,
  counter: 0,
  currentPage: 'home',
};

export const STATUS_TYPES = [
  'Conforme',
  'Sem Dispositivo',
  'Dispositivo danificado',
  'Consumida',
  'Sem acesso',
  'Desarmada',
  'Desligada',
  'Praga encontrada'
] as const;

interface ServiceData {
  clientName: string;
  clientCode: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  productsUsed: string;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DEVICE':
      return { ...state, selectedDevice: action.payload };
    case 'SET_STATUS':
      return { ...state, selectedStatus: action.payload };
    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload };
    case 'SET_DEVICES':
      return { ...state, devices: action.payload };
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(device =>
          device.id === action.payload.id
            ? { ...device, status: action.payload.status }
            : device
        )
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SAVE_DEVICES':
      return {
        ...state,
        savedDevices: [...state.savedDevices, ...state.devices],
      };
    case 'CLEAR_CURRENT':
      return {
        ...state,
        selectedDevice: '',
        selectedStatus: '',
        quantity: '',
        devices: [],
      };
    case 'RESET':
      return {
        ...state,
        selectedDevice: '',
        selectedStatus: '',
        quantity: '',
        devices: [],
        savedDevices: [],
        isLoading: false
      };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload };
    case 'ADD_SERVICE_ORDER':
      return {
        ...state,
        serviceOrders: [
          ...state.serviceOrders,
          {
            id: state.serviceOrders.length + 1,
            createdAt: new Date(),
            deviceCount: action.payload.devices.length,
            status: 'Concluída',
            devices: action.payload.devices,
            pdfUrl: action.payload.pdfUrl,
            client: action.payload.client,
            service: action.payload.service,
            product: action.payload.product,
            observations: action.payload.observations,
            startTime: action.payload.startTime,
            endTime: action.payload.endTime,
            signatures: action.payload.signatures
          }
        ],
        savedDevices: [],
        devices: [],
        selectedDevice: '',
        selectedStatus: '',
        quantity: '',
        currentPage: 'stats'
      };
    case 'SET_START_TIME':
      return {
        ...state,
        startTime: action.payload,
        isLoading: false
      };
    case 'SET_END_TIME':
      return {
        ...state,
        endTime: action.payload,
        isLoading: false
      };
    default:
      return state;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [state, dispatch] = useReducer(reducer, initialState);
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [observations, setObservations] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [productAmount, setProductAmount] = useState('');
  const [productUnit, setProductUnit] = useState('ml');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [targetPest, setTargetPest] = useState('');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    // Salvar devices quando houver mudanças
    storageService.saveDevices(state.devices);
  }, [state.devices]);

  useEffect(() => {
    // Salvar service orders quando houver mudanças
    storageService.saveServiceOrders(state.serviceOrders);
  }, [state.serviceOrders]);

  useEffect(() => {
    const startTimeStr = localStorage.getItem('serviceStartTime');
    if (startTimeStr) {
      dispatch({ type: 'SET_START_TIME', payload: new Date(startTimeStr) });
    }

    // Adicionar listener para o evento de início de OS
    const handleServiceStart = (event: CustomEvent) => {
      const { startTime } = event.detail;
      dispatch({ type: 'SET_START_TIME', payload: new Date(startTime) });
    };

    window.addEventListener('serviceStart', handleServiceStart as EventListener);

    return () => {
      window.removeEventListener('serviceStart', handleServiceStart as EventListener);
    };
  }, []);

  useEffect(() => {
    // Adicionar efeito para verificar OS em andamento
    const savedOrders = localStorage.getItem('serviceOrders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const activeOrder = orders.find(order => order.status === 'in_progress');
      if (activeOrder) {
        dispatch({ type: 'SET_START_TIME', payload: new Date(activeOrder.createdAt) });
      }
    }

    // Adicionar listener para o evento de início de OS
    const handleServiceOrderStart = (event: CustomEvent) => {
      const { startTime } = event.detail;
      dispatch({ type: 'SET_START_TIME', payload: new Date(startTime) });
    };

    window.addEventListener('serviceOrderStarted', handleServiceOrderStart as EventListener);

    return () => {
      window.removeEventListener('serviceOrderStarted', handleServiceOrderStart as EventListener);
    };
  }, []);

  const handleDeviceChange = (device: string) => {
    dispatch({ type: 'SET_DEVICE', payload: device });
  };

  const handleStatusChange = (status: string) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  };

  const handleQuantityChange = useCallback((newQuantity: string) => {
    try {
      const qty = parseInt(newQuantity);
      
      if (isNaN(qty)) {
        dispatch({ type: 'SET_QUANTITY', payload: '' });
        dispatch({ type: 'SET_DEVICES', payload: [] });
        return;
      }
      
      if (qty > 2000) {
        // toast.error('Quantidade máxima permitida é 2000');
        return;
      }
      
      if (qty < 0) {
        // toast.error('A quantidade não pode ser negativa');
        return;
      }
      
      dispatch({ type: 'SET_QUANTITY', payload: newQuantity });
      
      if (state.selectedDevice && newQuantity) {
        const newDevices = Array.from({ length: qty }, (_, index) => ({
          id: state.counter + index + 1,
          type: state.selectedDevice,
          number: state.counter + index + 1
        }));
        dispatch({ type: 'SET_DEVICES', payload: newDevices });
      } else {
        dispatch({ type: 'SET_DEVICES', payload: [] });
      }
    } catch (error) {
      console.error('Erro ao processar quantidade:', error);
      // toast.error('Erro ao processar quantidade');
    }
  }, [state.selectedDevice, state.counter]);

  const handleDeviceClick = useCallback((deviceId: number) => {
    const device = state.devices.find(d => d.id === deviceId);
    if (device) {
      // Se o dispositivo já tem status, remove o status (desseleção)
      // Se não tem status, usa o status selecionado ou 'Conforme' como padrão
      const newStatus = device.status ? null : (state.selectedStatus || 'Conforme');
      dispatch({
        type: 'UPDATE_DEVICE',
        payload: { id: deviceId, status: newStatus }
      });
    }
  }, [state.devices, state.selectedStatus]);

  const handleSelectAll = useCallback(() => {
    if (state.selectedStatus === 'Conforme') {
      const updatedDevices = state.devices.map(device => ({
        ...device,
        status: device.status ? device.status : 'Conforme'
      }));
      dispatch({ type: 'SET_DEVICES', payload: updatedDevices });
    } else {
      // toast.warning('Selecione o status "Conforme" para usar esta função');
    }
  }, [state.selectedStatus, state.devices]);

  const handleSaveDevices = useCallback(() => {
    if (state.devices.length === 0) {
      // toast.warning('Adicione dispositivos antes de salvar');
      return;
    }

    if (!state.devices.every(device => device.status)) {
      // toast.warning('Defina o status de todos os dispositivos antes de salvar');
      return;
    }

    dispatch({ type: 'SAVE_DEVICES' });
    dispatch({ type: 'CLEAR_CURRENT' });
    // toast.success('Dispositivos salvos com sucesso');
  }, [state.devices]);

  const createDeviceRanges = (numbers: number[]): string => {
    if (!numbers.length) return '';
    
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const ranges: string[] = [];
    let rangeStart = sortedNumbers[0];
    let prev = sortedNumbers[0];

    for (let i = 1; i <= sortedNumbers.length; i++) {
      const current = sortedNumbers[i];
      if (current !== prev + 1) {
        ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);
        rangeStart = current;
      }
      prev = current;
    }

    return ranges.join(', ');
  };

  const isTreatmentService = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_gel'].includes(serviceType);
  const isInspectionService = serviceType === 'inspecao';

  const canFinishOS = useCallback(() => {
    // Verificar campos obrigatórios
    if (!serviceType || !targetPest) return false;
    
    // Para serviços de tratamento, verificar se há produto selecionado
    if (isTreatmentService && !state.selectedProduct) return false;
    
    // Para monitoramento, verificar se há dispositivos selecionados
    if (serviceType === 'monitoramento' && state.savedDevices.length === 0) return false;
    
    return true;
  }, [serviceType, targetPest, isTreatmentService, state.selectedProduct, state.savedDevices.length]);

  const handleFinishOS = useCallback(async () => {
    if (!state.startTime) {
      // toast.error('Por favor, inicie a OS primeiro');
      return;
    }

    const now = new Date();
    dispatch({ type: 'SET_END_TIME', payload: now });
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('pt-BR');
      const formattedTime = currentDate.toLocaleTimeString('pt-BR');

      // Obter dados do cliente do localStorage
      const clientData = localStorage.getItem('selectedClient');
      const client = clientData ? JSON.parse(clientData) : null;

      // Agrupar dispositivos por tipo
      const deviceGroups = state.savedDevices.reduce((acc, device) => {
        if (!acc[device.type]) {
          acc[device.type] = {
            type: device.type,
            quantity: 0,
            status: [],
            list: []
          };
        }

        // Incrementa a quantidade total deste tipo de dispositivo
        acc[device.type].quantity++;
        acc[device.type].list.push(device.number.toString());

        // Processa os status do dispositivo
        const statusList = device.status ? [device.status] : ['N/A'];
        
        statusList.forEach(status => {
          const existingStatus = acc[device.type].status.find(s => s.name === status);
          if (existingStatus) {
            existingStatus.count++;
            existingStatus.devices.push(device.number);
          } else {
            acc[device.type].status.push({
              name: status,
              count: 1,
              devices: [device.number]
            });
          }
        });

        return acc;
      }, {} as Record<string, {
        type: string;
        quantity: number;
        status: Array<{
          name: string;
          count: number;
          devices: number[];
        }>;
        list: string[];
      }>);

      // Converter para o formato esperado pelo PDF
      const formattedDevices = Object.values(deviceGroups);

      // Preparar dados para o PDF
      const serviceData = {
        orderNumber: `${state.serviceOrders.length + 1}`,
        date: formattedDate,
        startTime: state.startTime?.toLocaleTimeString('pt-BR') || formattedTime,
        endTime: state.endTime?.toLocaleTimeString('pt-BR') || formattedTime,
        client: client || {
          code: "N/A",
          branch: "Cliente não selecionado",
          name: "Cliente não selecionado",
          document: "N/A",
          address: "N/A",
          contact: "N/A",
          phone: "N/A"
        },
        service: {
          type: serviceType,
          target: targetPest,
          location: location || "N/A"
        },
        product: state.selectedProduct ? {
          name: state.selectedProduct.name,
          activeIngredient: state.selectedProduct.activeIngredient,
          chemicalGroup: state.selectedProduct.chemicalGroup,
          registration: state.selectedProduct.registration,
          batch: state.selectedProduct.batch,
          validity: state.selectedProduct.validity,
          quantity: productAmount ? `${productAmount} ${state.selectedProduct.quantity}` : "N/A",
          dilution: state.selectedProduct.dilution
        } : null,
        devices: formattedDevices,
        observations: observations || "",
        signatures: {
          serviceResponsible: "Técnico Responsável",
          technicalResponsible: "Responsável Técnico",
          clientRepresentative: "Representante do Cliente"
        }
      };

      // Gerar e baixar o PDF
      try {
        const pdfBlob = await generateServiceOrderPDF(serviceData);
        const url = window.URL.createObjectURL(pdfBlob);
        
        // Adicionar à lista de ordens de serviço
        dispatch({
          type: 'ADD_SERVICE_ORDER',
          payload: {
            devices: state.savedDevices,
            pdfUrl: url,
            client: serviceData.client,
            service: serviceData.service,
            product: serviceData.product,
            observations: observations || "",
            startTime: formattedTime,
            endTime: formattedTime,
            signatures: serviceData.signatures
          }
        });

        // Baixar o PDF
        const link = document.createElement('a');
        link.href = url;
        link.download = `ordem-servico-${serviceData.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpar os campos após salvar
        setServiceType('');
        setTargetPest('');
        setApplicationMethod('');
        setLocation('');
        setObservations('');
        setProductAmount('');
        dispatch({ type: 'SET_SELECTED_PRODUCT', payload: null });
        dispatch({ type: 'CLEAR_CURRENT' });

        // Limpar o horário de início do localStorage
        localStorage.removeItem('serviceStartTime');

        showNotification('Ordem de serviço finalizada com sucesso!', 'success');
        
        // Obter o ID do agendamento ativo
        const savedOrders = localStorage.getItem('safeprag_service_orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const activeOrder = orders.find((order: any) => order.status === 'in_progress');
          if (activeOrder) {
            // Disparar evento de finalização com sucesso
            const finishEvent = new CustomEvent('serviceOrderFinished', { 
              detail: { success: true }
            });
            window.dispatchEvent(finishEvent);

            // Disparar evento de atualização do card
            const updateEvent = new CustomEvent('scheduleUpdate', {
              detail: { 
                scheduleId: activeOrder.scheduleId,
                status: 'completed'
              }
            });
            window.dispatchEvent(updateEvent);

            // Atualizar o status do agendamento
            updateScheduleStatus(activeOrder.scheduleId, 'completed');
          }
        }
        
        setActiveTab('schedule');
      } catch (pdfError) {
        console.error('Erro ao gerar PDF:', pdfError);
        showNotification('Erro ao gerar o PDF. Verifique os dados e tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao finalizar ordem de serviço:', error);
      showNotification('Erro ao finalizar ordem de serviço. Tente novamente.', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    canFinishOS,
    state.serviceOrders.length,
    serviceType,
    targetPest,
    location,
    productAmount,
    state.selectedProduct,
    observations,
    state.savedDevices,
    dispatch,
    setActiveTab
  ]);

  useEffect(() => {
    // Salvar devices quando houver mudanças
    storageService.saveDevices(state.devices);
  }, [state.devices]);

  useEffect(() => {
    // Salvar service orders quando houver mudanças
    storageService.saveServiceOrders(state.serviceOrders);
  }, [state.serviceOrders]);

  const handlePageChange = useCallback((page: string) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const shouldDisableFields = useCallback(() => {
    return serviceType === 'tratamento';
  }, [serviceType]);

  const canSave = useCallback(() => {
    if (isTreatmentService) {
      return true;
    }
    return !state.isLoading && state.devices.length > 0;
  }, [isTreatmentService, state.isLoading, state.devices.length]);

  const handleSaveTreatment = () => {
    // TODO: Implementar a lógica de salvar os dados do tratamento
    console.log('Salvando dados do tratamento');
  };

  const handleGenerateServiceOrder = useCallback(async (serviceData: ServiceData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const formattedDeviceGroups = state.savedDevices;

      const pdfUrl = await generateServiceOrderPDF({
        devices: formattedDeviceGroups,
        client: {
          code: serviceData.clientCode,
          name: serviceData.clientName,
          document: "N/A",
          address: "N/A",
          contact: "N/A",
          phone: "N/A",
          branch: "N/A"
        },
        service: {
          type: serviceType,
          target: targetPest,
          location: location
        },
        product: {
          name: state.selectedProduct?.name || "N/A",
          activeIngredient: state.selectedProduct?.activeIngredient || "N/A",
          chemicalGroup: state.selectedProduct?.chemicalGroup || "N/A",
          registration: state.selectedProduct?.registration || "N/A",
          batch: state.selectedProduct?.batch || "N/A",
          validity: state.selectedProduct?.validity || "N/A",
          quantity: `${productAmount} ${state.selectedProduct?.quantity}`,
          dilution: state.selectedProduct?.dilution || "N/A"
        },
        observations: observations,
        startTime: serviceData.time,
        endTime: serviceData.endTime,
        signatures: serviceData.signatures
      });

      dispatch({
        type: 'ADD_SERVICE_ORDER',
        payload: {
          devices: formattedDeviceGroups,
          pdfUrl,
          client: {
            code: serviceData.clientCode,
            name: serviceData.clientName,
            document: "N/A",
            address: "N/A",
            contact: "N/A",
            phone: "N/A",
            branch: "N/A"
          },
          service: {
            type: serviceType,
            target: targetPest,
            location: location
          },
          product: {
            name: state.selectedProduct?.name || "N/A",
            activeIngredient: state.selectedProduct?.activeIngredient || "N/A",
            chemicalGroup: state.selectedProduct?.chemicalGroup || "N/A",
            registration: state.selectedProduct?.registration || "N/A",
            batch: state.selectedProduct?.batch || "N/A",
            validity: state.selectedProduct?.validity || "N/A",
            quantity: `${productAmount} ${state.selectedProduct?.quantity}`,
            dilution: state.selectedProduct?.dilution || "N/A"
          },
          observations: observations,
          startTime: serviceData.time,
          endTime: serviceData.endTime,
          signatures: serviceData.signatures
        }
      });

      showNotification('Ordem de serviço gerada e baixada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao gerar ordem de serviço:', error);
      showNotification('Erro ao gerar ordem de serviço. Tente novamente.', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.savedDevices, serviceType, targetPest, location, productAmount, state.selectedProduct, observations, dispatch]);

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newServiceType = e.target.value;
    setServiceType(newServiceType);
    
    // Limpa o método de aplicação se não for tratamento
    if (newServiceType !== 'tratamento') {
      setApplicationMethod('');
    }
  };

  const handleOpenDeviceModal = () => {
    setShowDeviceModal(true);
  };

  console.log('Estado atual:', { activeTab, state });

  const navItems = [
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'activity', label: 'Atividade', icon: Activity },
    { id: 'settings', label: 'Admin', icon: Settings },
  ];

  const getActiveServiceOrder = () => {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      return orders.find(order => order.status === 'in_progress');
    }
    return null;
  };

  const finishServiceOrder = (orderId: number) => {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'finished' };
        }
        return order;
      });
      localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    }
  };

  const approveServiceOrder = (orderId: number) => {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'approved' };
        }
        return order;
      });
      localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'activity') {
      const startTimeStr = localStorage.getItem('serviceStartTime');
      if (startTimeStr) {
        dispatch({ type: 'SET_START_TIME', payload: new Date(startTimeStr) });
      }
    }
  };

  return (
    <KeepAliveProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        {activeTab === 'schedule' && (
          <ServiceScheduler 
            onTabChange={handleTabChange} 
            onOSStart={() => handleTabChange('activity')} 
          />
        )}
        {activeTab === 'activity' && (
          <ServiceActivity
            serviceType={serviceType}
            targetPest={targetPest}
            location={location}
            observations={observations}
            applicationMethod={applicationMethod}
            productAmount={productAmount}
            state={state}
            startTime={state.startTime}
            endTime={state.endTime}
            isLoading={state.isLoading}
            showDeviceModal={showDeviceModal}
            onServiceTypeChange={handleServiceTypeChange}
            onTargetPestChange={setTargetPest}
            onLocationChange={setLocation}
            onApplicationMethodChange={setApplicationMethod}
            onProductAmountChange={setProductAmount}
            onObservationsChange={setObservations}
            onOpenDeviceModal={handleOpenDeviceModal}
            onCloseDeviceModal={() => setShowDeviceModal(false)}
            onFinishOS={handleFinishOS}
            onApproveOS={() => setShowApprovalModal(true)}
            onProductSelect={(product) => {
              dispatch({
                type: 'SET_SELECTED_PRODUCT',
                payload: {
                  name: product.name,
                  activeIngredient: product.activeIngredient,
                  chemicalGroup: product.chemicalGroup,
                  registration: product.registration,
                  batch: product.batch,
                  validity: product.expirationDate,
                  quantity: product.measure,
                  dilution: product.diluent
                }
              });
            }}
            onDeviceChange={handleDeviceChange}
            onStatusChange={handleStatusChange}
            onQuantityChange={handleQuantityChange}
            onDeviceClick={handleDeviceClick}
            onSelectAll={handleSelectAll}
            onSaveDevices={handleSaveDevices}
            canFinishOS={canFinishOS}
            canSave={isTreatmentService || (!state.isLoading && state.devices.length > 0)}
          />
        )}
        {activeTab === 'settings' && <AdminPage />}
      </div>

      <NotificationToast />
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        items={navItems}
      />
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={(data) => {
          const activeOrder = getActiveServiceOrder();
          if (activeOrder) {
            approveServiceOrder(activeOrder.id);
            showNotification('Ordem de serviço aprovada com sucesso!', 'success');
            setActiveTab('schedule');
            setShowApprovalModal(false);
          }
        }}
      />
    </KeepAliveProvider>
  );
}

export default App;
