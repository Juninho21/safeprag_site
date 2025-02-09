import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, ThumbsUp } from 'lucide-react';
import { LocationSelector } from './LocationSelector';
import { DeviceSelector } from './DeviceSelector';
import { StatusSelector } from './StatusSelector';
import { QuantityInput } from './QuantityInput';
import { DeviceGrid } from './DeviceGrid';
import { DeviceSummary } from './DeviceSummary';
import { ProductSelector } from './ProductSelector';

interface ServiceActivityProps {
  serviceType: string;
  targetPest: string;
  location: string;
  observations: string;
  applicationMethod: string;
  productAmount: string;
  state: any;
  startTime: Date | null;
  endTime: Date | null;
  isLoading: boolean;
  showDeviceModal: boolean;
  onServiceTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTargetPestChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onApplicationMethodChange: (value: string) => void;
  onProductAmountChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onOpenDeviceModal: () => void;
  onCloseDeviceModal: () => void;
  onFinishOS: () => void;
  onApproveOS: () => void;
  onProductSelect: (product: any) => void;
  onDeviceChange: (device: string) => void;
  onStatusChange: (status: string) => void;
  onQuantityChange: (quantity: string) => void;
  onDeviceClick: (deviceId: number) => void;
  onSelectAll: () => void;
  onSaveDevices: () => void;
  canFinishOS: () => boolean;
  canSave: boolean;
}

const ServiceActivity: React.FC<ServiceActivityProps> = ({
  serviceType,
  targetPest,
  location,
  observations,
  applicationMethod,
  productAmount,
  state,
  startTime,
  endTime,
  isLoading,
  showDeviceModal,
  onServiceTypeChange,
  onTargetPestChange,
  onLocationChange,
  onApplicationMethodChange,
  onProductAmountChange,
  onObservationsChange,
  onOpenDeviceModal,
  onCloseDeviceModal,
  onFinishOS,
  onApproveOS,
  onProductSelect,
  onDeviceChange,
  onStatusChange,
  onQuantityChange,
  onDeviceClick,
  onSelectAll,
  onSaveDevices,
  canFinishOS,
  canSave
}) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const isTreatmentService = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_gel'].includes(serviceType);
  const showProductSelector = isTreatmentService || serviceType === 'monitoramento';
  const [showNewPestInput, setShowNewPestInput] = useState(false);
  const [newPest, setNewPest] = useState('');
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newService, setNewService] = useState('');
  const [localStartTime, setLocalStartTime] = useState<Date | null>(startTime);

  // Carrega o horário do localStorage ao montar o componente
  useEffect(() => {
    const storedStartTime = localStorage.getItem('serviceStartTime');
    if (storedStartTime) {
      setLocalStartTime(new Date(storedStartTime));
    }
  }, []);

  // Atualiza quando receber evento de início de OS
  useEffect(() => {
    const handleServiceStart = (event: CustomEvent) => {
      console.log('ServiceActivity recebeu evento de início de OS:', event.detail);
      if (event.detail?.startTime) {
        setLocalStartTime(new Date(event.detail.startTime));
      }
    };

    window.addEventListener('serviceStart', handleServiceStart as EventListener);
    return () => {
      window.removeEventListener('serviceStart', handleServiceStart as EventListener);
    };
  }, []);

  // Atualiza o localStartTime quando o startTime prop muda
  useEffect(() => {
    if (startTime) {
      setLocalStartTime(startTime);
    }
  }, [startTime]);

  // Recarregar a página quando a OS for finalizada com sucesso
  useEffect(() => {
    const handleServiceOrderFinished = (event: CustomEvent) => {
      if (event.detail?.success) {
        window.location.reload();
      }
    };

    window.addEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);
    return () => {
      window.removeEventListener('serviceOrderFinished', handleServiceOrderFinished as EventListener);
    };
  }, []);

  return (
    <div className="space-y-4 p-4" ref={dashboardRef}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Ordem de Serviço</h2>
          {localStartTime && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Início: </span>
              {localStartTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </div>
          )}
        </div>

        {/* Campo Tipo de Serviço */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Serviço *
          </label>
          <select
            value={serviceType}
            onChange={(e) => {
              if (e.target.value === 'novo_servico') {
                setShowNewServiceInput(true);
              } else {
                onServiceTypeChange(e);
              }
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Selecione o tipo de serviço</option>
            <option value="inspecao">Inspeção</option>
            <option value="monitoramento">Monitoramento</option>
            <option value="pulverizacao">Pulverização</option>
            <option value="atomizacao">Atomização</option>
            <option value="termonebulizacao">Termonebulização</option>
            <option value="polvilhamento">Polvilhamento</option>
            <option value="iscagem_gel">Iscagem com gel</option>
            <option value="novo_servico">+ Adicionar novo serviço</option>
          </select>

          {showNewServiceInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Digite o novo tipo de serviço"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (newService.trim()) {
                    const event = {
                      target: {
                        value: newService.trim()
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    onServiceTypeChange(event);
                    setNewService('');
                    setShowNewServiceInput(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setNewService('');
                  setShowNewServiceInput(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Campo Praga Alvo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Praga Alvo *
          </label>
          <select
            value={targetPest}
            onChange={(e) => {
              if (e.target.value === 'nova_praga') {
                setShowNewPestInput(true);
              } else {
                onTargetPestChange(e.target.value);
              }
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Selecione a praga alvo</option>
            <option value="roedores">Roedores</option>
            <option value="baratas">Baratas</option>
            <option value="moscas">Moscas</option>
            <option value="formigas">Formigas</option>
            <option value="cupins">Cupins</option>
            <option value="aranhas">Aranhas</option>
            <option value="escorpioes">Escorpiões</option>
            <option value="percevejos">Percevejos</option>
            <option value="pulgas">Pulgas</option>
            <option value="carrapatos">Carrapatos</option>
            <option value="traças">Traças</option>
            <option value="vespas">Vespas</option>
            <option value="nova_praga">+ Adicionar nova praga</option>
          </select>

          {showNewPestInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newPest}
                onChange={(e) => setNewPest(e.target.value)}
                placeholder="Digite a nova praga alvo"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (newPest.trim()) {
                    onTargetPestChange(newPest.trim());
                    setNewPest('');
                    setShowNewPestInput(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setNewPest('');
                  setShowNewPestInput(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Campo Local */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Local *
          </label>
          <LocationSelector
            value={location}
            onChange={onLocationChange}
          />
        </div>

        {/* Seleção de Produto */}
        {showProductSelector && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Foram utilizados produtos?</h4>
            <ProductSelector onProductSelect={onProductSelect} />
          </div>
        )}

        {/* Campo Quantidade de Produto */}
        {state.selectedProduct && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Produto ({state.selectedProduct.quantity})
            </label>
            <div className="relative">
              <input
                type="number"
                value={productAmount}
                onChange={(e) => onProductAmountChange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-16"
                placeholder={`Digite a quantidade em ${state.selectedProduct.quantity}`}
              />
              <div className="absolute inset-y-0 right-0 mt-1 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{state.selectedProduct.quantity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Grid de seletores */}
        {!isTreatmentService && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onOpenDeviceModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
            >
              Selecionar Dispositivos
            </button>
          </div>
        )}

        {/* Campo de Observações */}
        <div className="mb-4">
          <label
            htmlFor="observations"
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Observações
          </label>
          <textarea
            id="observations"
            value={observations}
            onChange={(e) => onObservationsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            rows={3}
            placeholder="Digite as observações aqui..."
          />
        </div>

        {startTime && !endTime && (
          <div className="text-green-600 font-medium mb-4">
            OS em andamento - Iniciada às {startTime.toLocaleTimeString()}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onFinishOS}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
            disabled={!canFinishOS()}
          >
            <CheckCircle className="h-5 w-5" />
            {isLoading ? (
              <span>Finalizando...</span>
            ) : (
              <span>Finalizar OS</span>
            )}
          </button>
          <button
            onClick={onApproveOS}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <ThumbsUp className="h-5 w-5" />
            Aprovar OS
          </button>
        </div>
      </div>

      {/* Modal de Dispositivos */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Selecionar Dispositivos</h2>
              <button
                onClick={onCloseDeviceModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {/* Seletor de Dispositivo primeiro */}
              <div className="mb-6">
                <DeviceSelector
                  selectedDevice={state.selectedDevice}
                  onDeviceChange={onDeviceChange}
                  disabled={isLoading}
                />
              </div>

              {/* Status do Dispositivo */}
              <div className="mb-6">
                <StatusSelector
                  selectedStatus={state.selectedStatus}
                  onStatusChange={onStatusChange}
                  onSelectAll={onSelectAll}
                  disabled={isLoading}
                  selectedDevice={state.selectedDevice}
                />
              </div>

              {/* Quantidade */}
              <div className="mb-6">
                <QuantityInput
                  quantity={state.quantity}
                  onQuantityChange={onQuantityChange}
                  selectedDevice={state.selectedDevice}
                  disabled={isLoading}
                />
              </div>

              {/* Grid de Dispositivos */}
              {state.devices.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <DeviceGrid devices={state.devices} onDeviceClick={onDeviceClick} />
                </div>
              )}

              {/* Dispositivos Salvos */}
              {state.savedDevices.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Dispositivos Salvos</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <DeviceSummary 
                      devices={state.savedDevices} 
                      selectedProduct={state.selectedProduct} 
                    />
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onSaveDevices}
                  disabled={!canSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Dispositivos
                </button>
                <button
                  onClick={onCloseDeviceModal}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceActivity;
