import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { AdminTabs } from './AdminTabs';
import ServiceOrdersManagement from './ServiceOrders/ServiceOrdersManagement';
import BackupMaintenance from './BackupMaintenance/BackupMaintenance';
import { ClientForm } from './ClientForm';
import { ProductForm } from './ProductForm';
import { ImageUpload } from './ImageUpload';
import { Shield, Trash2, RefreshCw, Database, Building2, Users, Package, User, Pen, Eye, X } from 'lucide-react';
import { STORAGE_KEYS, backupAllData, restoreBackup } from '../services/storageKeys';
import { finishAllActiveServiceOrders, cleanupSystemData } from '../services/ordemServicoService';
import { companyService } from '../services/dataService';
import { Modal } from './Modal';

interface CompanyData {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  logoUrl?: string;
  environmentalLicense: {
    number: string;
    date: string;
  };
  sanitaryPermit: {
    number: string;
    expiryDate: string;
  };
}

interface UserData {
  name: string;
  phone: string;
  email: string;
  signatureType: 'controlador' | 'tecnico';
  tecnicoName?: string;
  tecnicoCrea?: string;
  tecnicoPhone?: string;
  tecnicoEmail?: string;
  signature?: string;
  tecnicoSignature?: string;
}

const COMPANY_STORAGE_KEY = STORAGE_KEYS.COMPANY;

const emptyCompanyData: CompanyData = {
  name: '',
  cnpj: '',
  phone: '',
  address: '',
  email: '',
  logoUrl: '',
  environmentalLicense: {
    number: '',
    date: ''
  },
  sanitaryPermit: {
    number: '',
    expiryDate: ''
  }
};

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [showSavedData, setShowSavedData] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>(() => {
    const savedData = localStorage.getItem(COMPANY_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : emptyCompanyData;
  });
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : { 
      name: '', 
      phone: '', 
      email: '', 
      signatureType: 'controlador',
      tecnicoName: '',
      tecnicoCrea: '',
      tecnicoPhone: '',
      tecnicoEmail: '',
      signature: undefined,
      tecnicoSignature: undefined,
    };
  });

  const canvasControladorRef = useRef<HTMLCanvasElement>(null);
  const canvasTecnicoRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingControlador, setIsDrawingControlador] = useState(false);
  const [isDrawingTecnico, setIsDrawingTecnico] = useState(false);
  const [lastControladorX, setLastControladorX] = useState(0);
  const [lastControladorY, setLastControladorY] = useState(0);
  const [lastTecnicoX, setLastTecnicoX] = useState(0);
  const [lastTecnicoY, setLastTecnicoY] = useState(0);

  useEffect(() => {
    const loadCompanyData = () => {
      const data = companyService.getCompany();
      if (data) {
        setCompanyData(data);
      }
    };
    
    loadCompanyData();
  }, []);

  useEffect(() => {
    if (activeTab === 'userData') {
      setUserData(prev => ({ ...prev, signatureType: 'controlador' }));
    }
  }, [activeTab]);

  useEffect(() => {
    // Carregar dados salvos quando a aba for aberta
    if (activeTab === 'userData') {
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setUserData(prev => ({
          ...prev,
          ...parsedData,
          signatureType: prev.signatureType // Mantém o tipo selecionado
        }));
      }
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyData.name || !companyData.cnpj || !companyData.phone || !companyData.address || !companyData.email) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    try {
      companyService.saveCompany(companyData);
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyData));
      toast.success('Dados da empresa salvos com sucesso!');
      setShowSavedData(true);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast.error('Erro ao salvar dados da empresa');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir os dados da empresa?')) {
      localStorage.removeItem(COMPANY_STORAGE_KEY);
      setCompanyData(emptyCompanyData);
      setCompanyLogo(null);
      setShowSavedData(false);
      toast.success('Dados da empresa excluídos com sucesso!');
    }
  };

  const handleLogoUpload = async (file: File) => {
    setCompanyLogo(file);
    
    // Convert file to base64 for local storage
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setCompanyData(prev => ({
          ...prev,
          logoUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCompanyData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyData],
          [child]: value
        }
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBackup = () => {
    try {
      const backup = backupAllData();
      const backupStr = JSON.stringify(backup);
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safeprag_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      toast.error('Erro ao gerar backup');
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        restoreBackup(backup);
        toast.success('Backup restaurado com sucesso!');
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        toast.error('Erro ao restaurar backup');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveControlador = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Salvar os dados do controlador
    const controladorData = {
      ...userData,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      signatureType: 'controlador',
      signature: userData.signature,
    };
    
    console.log('Salvando dados do controlador:', controladorData);
    
    // Salvar no localStorage
    localStorage.setItem('userData', JSON.stringify(controladorData));

    // Atualizar as ordens de serviço existentes com o novo nome do controlador
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS);
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        console.log('Ordens antes da atualização:', orders);
        
        // Atualizar apenas o nome do controlador, mantendo todos os outros dados
        const updatedOrders = orders.map(order => {
          const updatedOrder = {
            ...order,
            controladorName: userData.name
          };
          return updatedOrder;
        });
        
        console.log('Ordens após atualização:', updatedOrders);
        localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(updatedOrders));
      }
    } catch (error) {
      console.error('Erro ao atualizar ordens de serviço:', error);
    }

    setIsSignatureModalOpen(false);
    setShowSavedData(true);
    
    // Disparar evento para recarregar os dados
    window.dispatchEvent(new Event('serviceOrdersUpdated'));
  };

  const handleSaveTecnico = (e: React.FormEvent) => {
    e.preventDefault();
    const savedData = localStorage.getItem('userData');
    const previousData = savedData ? JSON.parse(savedData) : {};
    
    const tecnicoData = {
      ...previousData,
      tecnicoName: userData.tecnicoName,
      tecnicoCrea: userData.tecnicoCrea,
      tecnicoPhone: userData.tecnicoPhone,
      tecnicoEmail: userData.tecnicoEmail,
      signatureType: userData.signatureType,
      // Mantém os dados do controlador
      name: previousData.name || userData.name,
      phone: previousData.phone || userData.phone,
      email: previousData.email || userData.email,
      tecnicoSignature: userData.tecnicoSignature,
    };
    
    localStorage.setItem('userData', JSON.stringify(tecnicoData));
    setUserData(tecnicoData);
    toast.success('Dados do Responsável Técnico salvos com sucesso!');
  };

  const handleSignatureTypeChange = (type: 'controlador' | 'tecnico') => {
    setUserData(prev => ({ ...prev, signatureType: type }));
  };

  const startDrawingControlador = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasControladorRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    setIsDrawingControlador(true);
    setLastControladorX(x);
    setLastControladorY(y);
  };

  const drawControlador = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingControlador || !canvasControladorRef.current) return;

    const canvas = canvasControladorRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(lastControladorX, lastControladorY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastControladorX(x);
    setLastControladorY(y);
  };

  const startDrawingTecnico = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    setIsDrawingTecnico(true);
    setLastTecnicoX(x);
    setLastTecnicoY(y);
  };

  const drawTecnico = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingTecnico || !canvasTecnicoRef.current) return;

    const canvas = canvasTecnicoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(lastTecnicoX, lastTecnicoY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastTecnicoX(x);
    setLastTecnicoY(y);
  };

  const stopDrawingControlador = () => {
    if (isDrawingControlador && canvasControladorRef.current) {
      setIsDrawingControlador(false);
      const signatureData = canvasControladorRef.current.toDataURL();
      setUserData(prev => ({ ...prev, signature: signatureData }));
    }
  };

  const clearControladorSignature = () => {
    if (canvasControladorRef.current) {
      const ctx = canvasControladorRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasControladorRef.current.width, canvasControladorRef.current.height);
        setUserData(prev => ({ ...prev, signature: undefined }));
      }
    }
  };

  const stopDrawingTecnico = () => {
    if (isDrawingTecnico && canvasTecnicoRef.current) {
      setIsDrawingTecnico(false);
      const signatureData = canvasTecnicoRef.current.toDataURL();
      setUserData(prev => ({ ...prev, tecnicoSignature: signatureData }));
    }
  };

  const clearTecnicoSignature = () => {
    if (canvasTecnicoRef.current) {
      const ctx = canvasTecnicoRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasTecnicoRef.current.width, canvasTecnicoRef.current.height);
        setUserData(prev => ({ ...prev, tecnicoSignature: undefined }));
      }
    }
  };

  const renderSignatureModal = () => {
    const isControlador = userData.signatureType === 'controlador';
    const title = isControlador ? 'Dados do Controlador de Pragas' : 'Dados do Responsável Técnico';

    return (
      <Modal
        isOpen={isSignatureModalOpen}
        onRequestClose={() => setIsSignatureModalOpen(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={() => setIsSignatureModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {isControlador ? (
              <>
                <div>
                  <p className="font-medium">Nome:</p>
                  <p>{userData.name || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Telefone:</p>
                  <p>{userData.phone || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Email:</p>
                  <p>{userData.email || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Assinatura:</p>
                  {userData.signature ? (
                    <img 
                      src={userData.signature} 
                      alt="Assinatura do Controlador" 
                      className="border border-gray-200 rounded mt-1"
                      style={{ maxWidth: '400px', background: 'white' }}
                    />
                  ) : (
                    <p>Nenhuma assinatura cadastrada</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium">Nome:</p>
                  <p>{userData.tecnicoName || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">CREA:</p>
                  <p>{userData.tecnicoCrea || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Telefone:</p>
                  <p>{userData.tecnicoPhone || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Email:</p>
                  <p>{userData.tecnicoEmail || '-'}</p>
                </div>

                <div>
                  <p className="font-medium">Assinatura:</p>
                  {userData.tecnicoSignature ? (
                    <img 
                      src={userData.tecnicoSignature} 
                      alt="Assinatura do Técnico" 
                      className="border border-gray-200 rounded mt-1"
                      style={{ maxWidth: '400px', background: 'white' }}
                    />
                  ) : (
                    <p>Nenhuma assinatura cadastrada</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Administração do Sistema</h1>
      
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4 sm:mt-6">
        {activeTab === 'empresa' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-6">
                <ImageUpload 
                  onFileSelect={handleLogoUpload} 
                  currentImageUrl={companyData.logoUrl}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={companyData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    id="cnpj"
                    name="cnpj"
                    value={companyData.cnpj}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Licença Ambiental */}
              <div className="col-span-2 mt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Licença Ambiental</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="environmentalLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Número da Licença
                    </label>
                    <input
                      type="text"
                      id="environmentalLicenseNumber"
                      name="environmentalLicense.number"
                      value={companyData.environmentalLicense.number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="environmentalLicenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Data da Licença
                    </label>
                    <input
                      type="date"
                      id="environmentalLicenseDate"
                      name="environmentalLicense.date"
                      value={companyData.environmentalLicense.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Alvará Sanitário */}
              <div className="col-span-2 mt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Alvará Sanitário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sanitaryPermitNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Número do Alvará
                    </label>
                    <input
                      type="text"
                      id="sanitaryPermitNumber"
                      name="sanitaryPermit.number"
                      value={companyData.sanitaryPermit.number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="sanitaryPermitExpiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Validade
                    </label>
                    <input
                      type="date"
                      id="sanitaryPermitExpiryDate"
                      name="sanitaryPermit.expiryDate"
                      value={companyData.sanitaryPermit.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                {showSavedData && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* Visualização dos dados da empresa */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
                <button
                  onClick={() => setShowSavedData(!showSavedData)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showSavedData ? 'Ocultar Dados' : 'Visualizar Dados'}
                </button>
              </div>

              {showSavedData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {companyData.logoUrl && (
                    <div className="col-span-full">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Logo da Empresa</h3>
                      <img
                        src={companyData.logoUrl}
                        alt="Logo da empresa"
                        className="max-h-32 object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nome da Empresa</h3>
                    <p className="mt-1 text-sm text-gray-900">{companyData.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
                    <p className="mt-1 text-sm text-gray-900">{companyData.cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                    <p className="mt-1 text-sm text-gray-900">{companyData.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{companyData.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                    <p className="mt-1 text-sm text-gray-900">{companyData.address || 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Licença Ambiental</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      Número: {companyData.environmentalLicense?.number || 'Não informado'}<br />
                      Data: {companyData.environmentalLicense?.date || 'Não informada'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Alvará Sanitário</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      Número: {companyData.sanitaryPermit?.number || 'Não informado'}<br />
                      Validade: {companyData.sanitaryPermit?.expiryDate || 'Não informada'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Clique em "Visualizar Dados" para ver as informações da empresa
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Clientes</h2>
            <ClientForm />
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Produtos</h2>
            <ProductForm />
          </div>
        )}

        {activeTab === 'assinaturas' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Assinaturas</h2>
            {/* Conteúdo da aba de assinaturas */}
            <div className="space-y-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Assinaturas</h2>
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Dados
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Assinatura
                    </label>
                    <select
                      value={userData.signatureType}
                      onChange={(e) => {
                        handleSignatureTypeChange(e.target.value as 'controlador' | 'tecnico');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="controlador">Controlador de pragas</option>
                      <option value="tecnico">Responsável técnico</option>
                    </select>
                  </div>

                  {userData.signatureType === 'controlador' && (
                    <form onSubmit={handleSaveControlador} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Dados do Controlador de Pragas
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                          </label>
                          <input
                            type="text"
                            value={userData.name}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            value={userData.phone}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={userData.email}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assinatura Manual
                          </label>
                          <div className="border border-gray-300 rounded-md p-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">
                                <Pen className="inline-block w-4 h-4 mr-1" />
                                Desenhe sua assinatura abaixo
                              </span>
                              <button
                                type="button"
                                onClick={clearControladorSignature}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Limpar
                              </button>
                            </div>
                            <canvas
                              ref={canvasControladorRef}
                              width={400}
                              height={200}
                              onMouseDown={startDrawingControlador}
                              onMouseMove={drawControlador}
                              onMouseUp={stopDrawingControlador}
                              onMouseOut={stopDrawingControlador}
                              onTouchStart={startDrawingControlador}
                              onTouchMove={drawControlador}
                              onTouchEnd={stopDrawingControlador}
                              className="border border-gray-200 rounded w-full bg-white cursor-crosshair"
                              style={{ touchAction: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Salvar Dados do Controlador
                        </button>
                      </div>
                    </form>
                  )}

                  {userData.signatureType === 'tecnico' && (
                    <form onSubmit={handleSaveTecnico} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Dados do Responsável Técnico
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                          </label>
                          <input
                            type="text"
                            value={userData.tecnicoName}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, tecnicoName: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CREA
                          </label>
                          <input
                            type="text"
                            value={userData.tecnicoCrea}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, tecnicoCrea: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            value={userData.tecnicoPhone}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, tecnicoPhone: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={userData.tecnicoEmail}
                            onChange={(e) =>
                              setUserData((prev) => ({ ...prev, tecnicoEmail: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assinatura Manual
                          </label>
                          <div className="border border-gray-300 rounded-md p-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">
                                <Pen className="inline-block w-4 h-4 mr-1" />
                                Desenhe sua assinatura abaixo
                              </span>
                              <button
                                type="button"
                                onClick={clearTecnicoSignature}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Limpar
                              </button>
                            </div>
                            <canvas
                              ref={canvasTecnicoRef}
                              width={400}
                              height={200}
                              onMouseDown={startDrawingTecnico}
                              onMouseMove={drawTecnico}
                              onMouseUp={stopDrawingTecnico}
                              onMouseOut={stopDrawingTecnico}
                              onTouchStart={startDrawingTecnico}
                              onTouchMove={drawTecnico}
                              onTouchEnd={stopDrawingTecnico}
                              className="border border-gray-200 rounded w-full bg-white cursor-crosshair"
                              style={{ touchAction: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Salvar Dados do Técnico
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              {renderSignatureModal()}
            </div>
          </div>
        )}

        {activeTab === 'os-certificados' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <ServiceOrdersManagement />
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="bg-white shadow rounded-lg p-3 sm:p-6">
            <BackupMaintenance />
          </div>
        )}
      </div>
    </div>
  );
};
