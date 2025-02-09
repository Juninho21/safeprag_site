import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AdminTabs } from '../components/AdminTabs';
import ServiceOrdersManagement from '../components/ServiceOrders/ServiceOrdersManagement';

interface CompanyData {
  name: string;
  fantasyName: string;
  cnpj: string;
  stateRegistration: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  technicalManager: string;
  crmv: string;
}

const initialCompanyData: CompanyData = {
  name: '',
  fantasyName: '',
  cnpj: '',
  stateRegistration: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  technicalManager: '',
  crmv: ''
};

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [companyData, setCompanyData] = useState<CompanyData>(initialCompanyData);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Carrega os dados da empresa do localStorage quando o componente monta
    const savedData = localStorage.getItem('companyData');
    if (savedData) {
      setCompanyData(JSON.parse(savedData));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    // Salva os dados no localStorage
    localStorage.setItem('companyData', JSON.stringify(companyData));
    setIsEditing(false);
    toast.success('Dados da empresa salvos com sucesso!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Administração do Sistema</h1>
      
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'empresa' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dados da Empresa</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isEditing 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isEditing ? 'Salvar' : 'Editar'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Razão Social</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.name}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="name"
                      value={companyData.name}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome Fantasia</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.fantasyName}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="fantasyName"
                      value={companyData.fantasyName}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.cnpj}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="cnpj"
                      value={companyData.cnpj}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Inscrição Estadual</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.stateRegistration}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="stateRegistration"
                      value={companyData.stateRegistration}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.address}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="address"
                      value={companyData.address}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cidade</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.city}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="city"
                      value={companyData.city}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.state}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="state"
                      value={companyData.state}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CEP</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.zipCode}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="zipCode"
                      value={companyData.zipCode}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.phone}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="phone"
                      value={companyData.phone}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">E-mail</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.email}</p>
                  {isEditing && (
                    <input
                      type="email"
                      name="email"
                      value={companyData.email}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Responsável Técnico</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.technicalManager}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="technicalManager"
                      value={companyData.technicalManager}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CRMV</h3>
                  <p className="mt-1 text-sm text-gray-900">{companyData.crmv}</p>
                  {isEditing && (
                    <input
                      type="text"
                      name="crmv"
                      value={companyData.crmv}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Clientes</h2>
            {/* Conteúdo da aba de clientes */}
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos</h2>
            {/* Conteúdo da aba de produtos */}
          </div>
        )}

        {activeTab === 'assinaturas' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assinaturas</h2>
            {/* Conteúdo da aba de assinaturas */}
          </div>
        )}

        {activeTab === 'os-certificados' && (
          <div className="bg-white shadow rounded-lg p-6">
            <ServiceOrdersManagement />
          </div>
        )}
      </div>
    </div>
  );
};
