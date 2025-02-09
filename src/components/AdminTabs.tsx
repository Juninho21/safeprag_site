import React from 'react';
import { Building, Users, Package, FileText, ClipboardList, Database } from 'lucide-react';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap border-b overflow-x-auto">
      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'empresa' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('empresa')}
      >
        <Building size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">Empresa</span>
      </button>
      
      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'clientes' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('clientes')}
      >
        <Users size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">Clientes</span>
      </button>
      
      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'produtos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('produtos')}
      >
        <Package size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">Produtos</span>
      </button>
      
      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'assinaturas' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('assinaturas')}
      >
        <FileText size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">Assinaturas</span>
      </button>

      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'os-certificados' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('os-certificados')}
      >
        <ClipboardList size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">OS e Certificados</span>
      </button>

      <button
        className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base md:px-4 md:py-2 ${
          activeTab === 'backup' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
        }`}
        onClick={() => onTabChange('backup')}
      >
        <Database size={18} className="min-w-[18px]" />
        <span className="whitespace-nowrap">Backup e Manutenção</span>
      </button>
    </div>
  );
};
