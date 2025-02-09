import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DatePicker } from '../ui/date-picker';
import { getAllStoredPDFs, downloadPDFFromStorage, generateCertificatePDF } from '../../services/pdfService';
import { getServiceOrders, getAllServiceOrders, saveServiceOrder } from '../../services/ordemServicoService';
import { ServiceOrderResponsiveView } from './ServiceOrderResponsiveView';
import { STORAGE_KEYS } from '../../services/storageKeys';

interface ServiceOrderFilters {
  orderNumber: string;
  jde: string;
  clientName: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface UserData {
  name: string;
  signatureType: string;
}

export default function ServiceOrdersManagement() {
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState<ServiceOrderFilters>({
    orderNumber: '',
    jde: '',
    clientName: '',
    startDate: null,
    endDate: null
  });

  // Função para obter o nome do controlador de pragas
  const getControladorName = (): string => {
    try {
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.signatureType === 'controlador' && data.name) {
          return data.name;
        }
      }
      return 'Não informado';
    } catch (error) {
      console.error('Erro ao obter nome do controlador:', error);
      return 'Não informado';
    }
  };

  const handleViewServiceOrder = (orderNumber: string) => {
    try {
      downloadPDFFromStorage(orderNumber, 'os');
    } catch (error) {
      console.error('Erro ao baixar a OS:', error);
    }
  };

  const handleViewCertificate = async (orderNumber: string) => {
    try {
      // Buscar a ordem de serviço
      const order = data.find(item => item.numOS === orderNumber);
      if (!order) {
        console.error('Ordem de serviço não encontrada');
        return;
      }

      // Converter a data de início para objeto Date
      const dateParts = order.inicio.split('/');
      const serviceDate = new Date(
        parseInt(dateParts[2]), // ano
        parseInt(dateParts[1]) - 1, // mês (0-11)
        parseInt(dateParts[0]) // dia
      );

      // Calcular data de validade (1 mês após a data do serviço)
      const validUntil = new Date(serviceDate);
      validUntil.setMonth(validUntil.getMonth() + 1);

      // Preparar dados para o certificado
      const certificateData = {
        orderNumber: order.numOS,
        client: {
          name: order.nomeFantasia,
          document: order.jde,
          address: order.clientAddress || '',
          branch: order.cadeia,
        },
        serviceType: order.serviceType || 'Controle de Pragas',
        targetPests: order.targetPests || ['Insetos', 'Roedores'],
        locations: order.locations || ['Área Interna', 'Área Externa'],
        products: order.products || [],
        serviceDate: serviceDate.toISOString(),
        validUntil: validUntil.toISOString(),
      };

      // Gerar o certificado
      await generateCertificatePDF(certificateData);

    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
    }
  };

  const loadData = async () => {
    try {
      console.log('Iniciando carregamento de dados...');
      
      // Buscar ordens de serviço
      const serviceOrders = await getAllServiceOrders();
      console.log('Total de ordens carregadas:', serviceOrders.length);
      
      // Buscar PDFs armazenados
      const storedPDFs = await getAllStoredPDFs() || [];
      console.log('Total de PDFs armazenados:', storedPDFs.length);
      
      // Debug: verificar dados do usuário atual
      const savedUserData = localStorage.getItem('userData');
      const userData = savedUserData ? JSON.parse(savedUserData) : null;
      console.log('Dados do usuário:', userData);
      
      // Combinar os dados
      const allOrders = new Map();
      
      // Adicionar ordens de serviço primeiro
      serviceOrders.forEach(order => {
        const inicioDate = new Date(order.createdAt);
        
        // Usar o nome do controlador da ordem
        let controlador = order.controladorName;
        
        console.log('Processando ordem:', {
          id: order.id,
          controladorName: controlador,
          createdAt: order.createdAt,
          status: order.status
        });
        
        const orderData = {
          numOS: order.id,
          jde: order.clientId || '',
          nomeFantasia: order.clientName,
          cadeia: order.clientBranch || order.clientName,
          inicio: inicioDate.toLocaleDateString(),
          inicioDate,
          tecnico: controlador || 'Não informado',
          status: order.status === 'in_progress' ? 'EM ANDAMENTO' : 
                 order.status === 'completed' ? 'CONCLUÍDO' : 
                 order.status === 'approved' ? 'APROVADO' : 'CANCELADO'
        };
        
        allOrders.set(order.id, orderData);
      });

      // Adicionar PDFs armazenados (certificados)
      storedPDFs.forEach(pdf => {
        if (!pdf.orderNumber) return;
        
        const inicioDate = new Date(pdf.createdAt);
        const existingOrder = allOrders.get(pdf.orderNumber);
        
        // Se já existe uma ordem com este número, atualizar apenas se for certificado
        if (existingOrder) {
          existingOrder.hasCertificate = true;
          existingOrder.status = 'CERTIFICADO';
        } else {
          // Se não existe, criar uma nova entrada
          const pdfData = {
            numOS: pdf.orderNumber,
            jde: pdf.clientCode || '',
            nomeFantasia: pdf.clientName,
            cadeia: pdf.clientBranch || pdf.clientName,
            inicio: inicioDate.toLocaleDateString(),
            inicioDate,
            tecnico: userData?.name || 'Não informado',
            status: 'CERTIFICADO',
            hasCertificate: true
          };
          allOrders.set(pdf.orderNumber, pdfData);
        }
      });

      // Converter o Map para array e ordenar por data (mais recente primeiro)
      const orderedData = Array.from(allOrders.values())
        .sort((a, b) => b.inicioDate.getTime() - a.inicioDate.getTime());

      console.log('Dados ordenados para exibição:', orderedData);
      setData(orderedData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    loadData();

    // Adicionar listener para recarregar os dados quando o controlador for atualizado
    const handleServiceOrdersUpdated = () => {
      console.log('Evento de atualização recebido, recarregando dados...');
      loadData();
    };

    window.addEventListener('serviceOrdersUpdated', handleServiceOrdersUpdated);

    // Remover listener quando o componente desmontar
    return () => {
      window.removeEventListener('serviceOrdersUpdated', handleServiceOrdersUpdated);
    };
  }, []);

  const handleSearch = () => {
    const filteredData = data.filter(item => {
      const matchOrderNumber = !filters.orderNumber || item.numOS.toLowerCase().includes(filters.orderNumber.toLowerCase());
      const matchJde = !filters.jde || item.jde.toLowerCase().includes(filters.jde.toLowerCase());
      const matchClientName = !filters.clientName || 
        item.nomeFantasia.toLowerCase().includes(filters.clientName.toLowerCase()) ||
        item.cadeia.toLowerCase().includes(filters.clientName.toLowerCase());
      const matchStartDate = !filters.startDate || new Date(item.inicioDate) >= filters.startDate;
      const matchEndDate = !filters.endDate || new Date(item.inicioDate) <= filters.endDate;

      return matchOrderNumber && matchJde && matchClientName && matchStartDate && matchEndDate;
    });

    const orderedData = filteredData.sort((a, b) => b.inicioDate.getTime() - a.inicioDate.getTime());
    setData(orderedData);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Input
          type="text"
          placeholder="Número da O.S."
          value={filters.orderNumber}
          onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Código do Cliente"
          value={filters.jde}
          onChange={(e) => setFilters({ ...filters, jde: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Nome do Cliente"
          value={filters.clientName}
          onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
        />
        <DatePicker
          placeholder="Data Inicial"
          value={filters.startDate}
          onChange={(date) => setFilters({ ...filters, startDate: date })}
        />
        <DatePicker
          placeholder="Data Final"
          value={filters.endDate}
          onChange={(date) => setFilters({ ...filters, endDate: date })}
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSearch}
          className="w-full sm:w-auto"
        >
          Buscar
        </Button>
      </div>

      <ServiceOrderResponsiveView
        data={data}
        onViewServiceOrder={handleViewServiceOrder}
        onViewCertificate={handleViewCertificate}
      />
    </div>
  );
}
