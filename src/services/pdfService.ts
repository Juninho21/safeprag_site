// @ts-ignore
import html2pdf from 'html2pdf.js';
import { ServiceOrderPDFData } from '../types/pdf.types';
import { getNextOSNumber } from './counterService';

interface CompanyData {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  logoUrl?: string;
  environmentalLicense?: {
    number: string;
    date: string;
  };
  sanitaryPermit?: {
    number: string;
    expiryDate: string;
  };
}

const COMPANY_STORAGE_KEY = 'safeprag_company_data';
const SERVICE_ORDERS_KEY = 'safeprag_service_orders';
const SCHEDULES_KEY = 'safeprag_schedules';
const PDF_STORAGE_KEY = 'safeprag_service_order_pdfs';
const MAX_AGE_DAYS = 30;

// Função para limpar PDFs antigos
const cleanupOldPDFs = () => {
  try {
    const storedPDFs = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
    const now = new Date();
    
    // Filtrar apenas PDFs dos últimos 30 dias
    const validPDFs = Object.entries(storedPDFs).reduce((acc, [key, value]: [string, any]) => {
      const createdAt = new Date(value.createdAt);
      const diffInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffInDays <= MAX_AGE_DAYS) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(validPDFs));
  } catch (error) {
    console.error('Erro ao limpar PDFs antigos:', error);
  }
};

// Função para salvar o PDF no localStorage
export const storeServiceOrderPDF = (pdfBlob: Blob, serviceData: ServiceOrderPDFData): void => {
  try {
    // Limpar PDFs antigos antes de salvar novo
    cleanupOldPDFs();
    
    // Converter Blob para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64PDF = (reader.result as string).split(',')[1];
      
      // Obter nome do controlador de pragas da aba assinaturas
      let nomeTecnico = '';
      try {
        const controladorData = localStorage.getItem('controlador_pragas');
        if (controladorData) {
          const dados = JSON.parse(controladorData);
          nomeTecnico = dados.nome || '';
        }
      } catch (error) {
        console.error('Erro ao obter nome do controlador:', error);
      }
      
      // Armazena no localStorage
      const storedPDFs = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
      storedPDFs[serviceData.orderNumber] = {
        pdf: base64PDF,
        createdAt: new Date().toISOString(),
        clientName: serviceData.client.name,
        serviceType: serviceData.service.type,
        orderNumber: serviceData.orderNumber,
        clientCode: serviceData.client.code,
        clientBranch: serviceData.client.branch,
        technician: nomeTecnico
      };
      
      localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(storedPDFs));
    };
    reader.readAsDataURL(pdfBlob);
  } catch (error) {
    console.error('Erro ao armazenar PDF:', error);
    throw error;
  }
};

// Função para obter todos os PDFs armazenados
export const getAllStoredPDFs = () => {
  try {
    console.log('Buscando todos os PDFs armazenados...');
    
    // Limpar PDFs antigos antes de retornar
    cleanupOldPDFs();
    
    const storedData = localStorage.getItem(PDF_STORAGE_KEY);
    if (!storedData) {
      console.log('Nenhum PDF encontrado no storage');
      return [];
    }

    const pdfs = Object.entries(JSON.parse(storedData)).map(([orderNumber, data]: [string, any]) => ({
      orderNumber,
      ...data
    }));

    console.log(`Encontrados ${pdfs.length} PDFs armazenados`);
    return pdfs;
  } catch (error) {
    console.error('Erro ao buscar PDFs armazenados:', error);
    return [];
  }
};

// Função para baixar um PDF específico
export const downloadPDFFromStorage = (orderNumber: string): void => {
  try {
    console.log('Iniciando download da OS:', orderNumber);
    
    // Buscar PDF do localStorage
    const storedPDFs = JSON.parse(localStorage.getItem(PDF_STORAGE_KEY) || '{}');
    console.log('PDFs armazenados:', Object.keys(storedPDFs));
    
    const pdfData = storedPDFs[orderNumber];
    if (!pdfData) {
      console.error('PDF não encontrado para OS:', orderNumber);
      throw new Error(`PDF não encontrado para a ordem de serviço ${orderNumber}`);
    }
    
    if (!pdfData.pdf) {
      console.error('Dados do PDF inválidos para OS:', orderNumber);
      throw new Error(`Dados do PDF inválidos para a ordem de serviço ${orderNumber}`);
    }

    console.log('PDF encontrado, iniciando conversão...');

    // Converte base64 para blob
    const binaryString = atob(pdfData.pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Cria URL e inicia download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ordem-servico-${orderNumber}-${pdfData.clientName}.pdf`;
    
    console.log('Iniciando download do arquivo...');
    document.body.appendChild(link);
    link.click();
    
    // Limpeza
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Download concluído e recursos liberados');
    }, 100);
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw error;
  }
};

export const generateServiceOrderPDF = async (
  serviceData: ServiceOrderPDFData
) => {
  try {
    // Gerar número sequencial da OS
    const osNumber = getNextOSNumber();
    serviceData.orderNumber = osNumber.toString();

    // Buscar dados da empresa do localStorage
    const companyDataStr = localStorage.getItem(COMPANY_STORAGE_KEY);
    let companyData: CompanyData;
    
    if (!companyDataStr) {
      console.warn('Dados da empresa não encontrados no localStorage');
      companyData = {
        name: '',
        cnpj: '',
        address: '',
        phone: '',
        email: ''
      };
    } else {
      try {
        companyData = JSON.parse(companyDataStr);
      } catch (error) {
        console.error('Erro ao parsear dados da empresa:', error);
        companyData = {
          name: '',
          cnpj: '',
          address: '',
          phone: '',
          email: ''
        };
      }
    }

    // Buscar dados da assinatura do cliente do localStorage
    const clientSignatureData = localStorage.getItem('client_signature_data');
    let clientData = null;
    if (clientSignatureData) {
      try {
        clientData = JSON.parse(clientSignatureData);
      } catch (error) {
        console.error('Erro ao parsear dados da assinatura do cliente:', error);
      }
    }

    // Buscar ordem de serviço ativa
    const serviceOrdersStr = localStorage.getItem(SERVICE_ORDERS_KEY);
    const serviceOrders = serviceOrdersStr ? JSON.parse(serviceOrdersStr) : [];
    const activeOrder = serviceOrders.find((order: any) => order.status === 'in_progress');

    // Se encontrou uma OS ativa, buscar o agendamento correspondente
    if (activeOrder) {
      const schedulesStr = localStorage.getItem(SCHEDULES_KEY);
      const schedules = schedulesStr ? JSON.parse(schedulesStr) : [];
      const schedule = schedules.find((s: any) => s.id === activeOrder.scheduleId);

      if (schedule) {
        // Buscar dados completos do cliente
        const clientsStr = localStorage.getItem('safeprag_clients');
        const clients = clientsStr ? JSON.parse(clientsStr) : [];
        const client = clients.find((c: any) => c.id === schedule.clientId);

        // Atualizar os dados do cliente com as informações completas
        serviceData.client = {
          code: client?.code || schedule.clientId || 'N/A',
          name: client?.name || schedule.clientName || 'Cliente não selecionado',
          branch: client?.branch || schedule.clientBranch || client?.name || 'N/A',
          document: client?.document || schedule.clientDocument || 'N/A',
          address: client?.address || schedule.clientAddress || 'N/A',
          contact: client?.contact || schedule.clientContact || 'N/A',
          phone: client?.phone || schedule.clientPhone || 'N/A',
          email: client?.email || schedule.clientEmail || 'N/A'
        };
      }
    }

    // Função para formatar data no padrão brasileiro
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr; // Se não for uma data válida, retorna o texto original
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dateStr; // Em caso de erro, retorna o texto original
      }
    };

    // Função para formatar hora no padrão HH:mm:ss
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '--:--:--';
      try {
        const timeParts = timeStr.split(':');
        if (timeParts.length < 3) return `${timeParts[0]}:${timeParts[1]}:00`;
        return `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`;
      } catch (error) {
        console.error('Erro ao formatar hora:', error);
        return timeStr; // Em caso de erro, retorna o texto original
      }
    };

    // Função para calcular a duração
    const calculateDuration = (startTime: string, endTime: string) => {
      if (!startTime || !endTime) return '';
      try {
        const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
        const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);
        
        let diffSeconds = (endHours * 3600 + endMinutes * 60 + endSeconds) - 
                         (startHours * 3600 + startMinutes * 60 + startSeconds);
        
        if (diffSeconds < 0) {
          diffSeconds += 24 * 3600; // Adiciona 24 horas se passar da meia-noite
        }
        
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        
        return `${hours}h ${minutes}min ${seconds}s`;
      } catch (error) {
        console.error('Erro ao calcular duração:', error);
        return '';
      }
    };

    // Criar um elemento temporário para o relatório
    const reportElement = document.createElement('div');
    reportElement.className = 'report-container';

    // Adiciona estilos globais
    const style = document.createElement('style');
    style.textContent = `
      @page {
        margin: 10mm 10mm 10mm 10mm;
      }
      .report-container {
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .section-container {
        page-break-inside: avoid;
        margin-bottom: 10px;
      }
      .complementary-section {
        margin-top: 20px;
      }
      table {
        margin: 0;
        padding: 0;
        page-break-inside: avoid;
      }
    `;
    document.head.appendChild(style);

    // Cabeçalho principal
    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.margin = '0';
    header.style.padding = '0';

    // Criar tabela para alinhar conteúdo
    header.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 33%; vertical-align: top;">
            <img src="${companyData?.logoUrl || ''}" alt="Logo" style="width: 150px; margin-bottom: 5px;">
          </td>
          <td style="width: 33%; text-align: center; vertical-align: middle;">
            <div style="font-size: 18px; font-weight: bold;">
              Ordem De Serviço
            </div>
          </td>
          <td style="width: 33%; text-align: right; vertical-align: top;">
            <div style="font-size: 14px; font-weight: bold; color: #000;">
              Nº O.S.: ${serviceData.orderNumber}
            </div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px;">
        <tr>
          <td style="width: 70%; line-height: 1.3;">
            <div>${companyData?.name || ''}</div>
            <div>CNPJ: ${companyData?.cnpj || ''}</div>
            <div>Endereço: ${companyData?.address || ''}</div>
            <div>Telefone: ${companyData?.phone || ''}</div>
            <div>Email: ${companyData?.email || ''}</div>
          </td>
          <td style="width: 30%; text-align: right; line-height: 1.3;">
            <div>Data: ${formatDate(serviceData.date)}</div>
            <div>Hora Início: ${formatTime(serviceData.startTime)}</div>
            <div>Hora Fim: ${formatTime(serviceData.endTime)}</div>
            <div>Duração: ${calculateDuration(serviceData.startTime, serviceData.endTime)}</div>
          </td>
        </tr>
      </table>
    `;

    // Container para licenças
    const licensesContainer = document.createElement('div');
    licensesContainer.style.width = '100%';
    licensesContainer.style.display = 'flex';
    licensesContainer.style.justifyContent = 'space-between';
    licensesContainer.style.fontSize = '12px';
    licensesContainer.style.marginTop = '5px';
    licensesContainer.style.marginBottom = '5px';
    licensesContainer.style.paddingTop = '5px';
    licensesContainer.style.borderTop = '1px solid #000';

    // Licença Ambiental
    const environmentalLicense = document.createElement('div');
    environmentalLicense.innerHTML = `Licença Ambiental: ${companyData?.environmentalLicense?.number || '000000'} - Data: ${formatDate(companyData?.environmentalLicense?.date) || '11/07/2024'}`;

    // Alvará Sanitário
    const sanitaryPermit = document.createElement('div');
    sanitaryPermit.style.textAlign = 'right';
    sanitaryPermit.innerHTML = `Alvará Sanitário: ${companyData?.sanitaryPermit?.number || '000000'} - Validade: ${formatDate(companyData?.sanitaryPermit?.expiryDate) || '11/05/2025'}`;

    licensesContainer.appendChild(environmentalLicense);
    licensesContainer.appendChild(sanitaryPermit);

    // Linha divisória
    const divider = document.createElement('div');
    divider.style.width = '100%';
    divider.style.height = '1px';
    divider.style.backgroundColor = '#000';
    divider.style.margin = '5px 0';

    // Seção de serviço por contrato
    const serviceSection = document.createElement('div');
    serviceSection.style.marginTop = '10px';
    serviceSection.innerHTML = '';

    // Dados do cliente
    const clientSection = document.createElement('div');
    clientSection.style.margin = '0';
    clientSection.style.padding = '0';
    clientSection.innerHTML = `
      <div style="background-color: #1a73e8; color: white; padding: 5px 10px; margin: 10px 0;">Dados Do Cliente</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
        <div>
          <div>Código Do Cliente: ${serviceData.client.code || 'N/A'}</div>
          <div>Razão Social: ${serviceData.client.branch || 'Cliente não selecionado'}</div>
          <div>Nome Fantasia: ${serviceData.client.name || 'Cliente não selecionado'}</div>
          <div>CNPJ/CPF: ${serviceData.client.document || 'N/A'}</div>
        </div>
        <div>
          <div>Endereço: ${serviceData.client.address || 'N/A'}</div>
          <div>Telefone: ${serviceData.client.phone || 'N/A'}</div>
          <div>Contato: ${clientData?.contato || 'N/A'}</div>
          <div>Email: ${clientData?.emails?.[0] || 'N/A'}</div>
        </div>
      </div>
    `;

    // Informações dos serviços
    const servicesInfoSection = document.createElement('div');
    servicesInfoSection.style.marginTop = '20px';
    servicesInfoSection.style.backgroundColor = '#1a73e8';
    servicesInfoSection.style.color = 'white';
    servicesInfoSection.style.padding = '5px 10px';
    servicesInfoSection.innerHTML = 'Informações Dos Serviços';

    // Tabela de serviço
    const serviceTable = document.createElement('div');
    serviceTable.style.marginTop = '20px';
    serviceTable.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">Tratamento</div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #1a73e8; color: white;">
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Serviço</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Praga Alvo</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Local</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.service.type.charAt(0).toUpperCase() + serviceData.service.type.slice(1)}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.service.target.charAt(0).toUpperCase() + serviceData.service.target.slice(1)}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.service.location}</td>
          </tr>
        </tbody>
      </table>

      ${serviceData.product ? `
      <div style="font-weight: bold; margin-bottom: 10px;">Produtos Utilizados</div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #1a73e8; color: white;">
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Produto (Concen.)</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd; width: 10%;">Prin. Ativo</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Gru. Químico</th>
            <th style="padding: 5px; border: 1px solid #ddd;">Registro</th>
            <th style="padding: 5px; border: 1px solid #ddd;">Lote</th>
            <th style="padding: 5px; border: 1px solid #ddd;">Validade</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Qtde.</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Diluente</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.name}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.activeIngredient}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.chemicalGroup}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.registration}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.batch}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${formatDate(serviceData.product.validity)}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.quantity}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">${serviceData.product.dilution}</td>
          </tr>
        </tbody>
      </table>
      ` : ''}
    `;

    // Dispositivos monitorados - só cria se não for um dos tipos de serviço de tratamento ou inspeção
    let devicesSection = null;
    console.log('Tipo de serviço:', serviceData.service.type); // Debug
    const treatmentTypes = ['pulverizacao', 'atomizacao', 'termonebulizacao', 'polvilhamento', 'iscagem_gel', 'inspeção', 'inspeçao'];
    if (!treatmentTypes.includes(serviceData.service.type.toLowerCase())) {
      devicesSection = document.createElement('div');
      devicesSection.style.marginTop = '20px';
      devicesSection.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Dispositivos Monitorados</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #1a73e8; color: white;">
              <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Dispositivos</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #ddd; width: 10%;">Quant. Instalada</th>
              <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Status</th>
              <th style="padding: 5px; border: 1px solid #ddd;">Lista De Dispositivos</th>
            </tr>
          </thead>
          <tbody>
            ${serviceData.devices.map(device => {
              // Função para agrupar números em sequências
              const getSequences = (numbers: number[]): string => {
                if (numbers.length === 0) return '';
                
                const sortedNumbers = [...numbers].sort((a, b) => a - b);
                const sequences: string[] = [];
                let start = sortedNumbers[0];
                let prev = start;

                for (let i = 1; i <= sortedNumbers.length; i++) {
                  if (i === sortedNumbers.length || sortedNumbers[i] !== prev + 1) {
                    if (start === prev) {
                      sequences.push(start.toString());
                    } else {
                      sequences.push(`${start}-${prev}`);
                    }
                    if (i < sortedNumbers.length) {
                      start = sortedNumbers[i];
                      prev = start;
                    }
                  } else {
                    prev = sortedNumbers[i];
                  }
                }

                return sequences.join(', ');
              };

              return `
                <tr>
                  <td style="padding: 5px; border: 1px solid #ddd;">${device.type}</td>
                  <td style="padding: 5px; border: 1px solid #ddd;">${device.quantity}</td>
                  <td style="padding: 5px; border: 1px solid #ddd; font-size: 10px;">
                    ${device.status
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((statusItem, index, array) => {
                        const percentage = ((statusItem.count / device.quantity) * 100).toFixed(1);
                        return `
                          <div style="font-size: 10px;">
                            ${statusItem.name} (${statusItem.count} - ${percentage}%)
                            ${index < array.length - 1 ? '<br><br>' : ''}
                          </div>
                        `;
                      }).join('')}
                  </td>
                  <td style="padding: 5px; border: 1px solid #ddd; font-size: 10px;">
                    ${device.status
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((statusItem, index, array) => {
                        const sequence = getSequences(statusItem.devices);
                        return `
                          ${statusItem.name}:
                          <br>
                          ${sequence}
                          ${index < array.length - 1 ? '<br><br>' : ''}
                        `;
                      }).join('')}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // Seção de informações complementares
    const complementarySection = document.createElement('div');
    complementarySection.className = 'section-container complementary-section';
    complementarySection.style.marginTop = '20px';

    // Título das informações complementares
    const complementaryTitle = document.createElement('div');
    complementaryTitle.style.backgroundColor = '#1a75ff';
    complementaryTitle.style.color = 'white';
    complementaryTitle.style.padding = '5px 10px';
    complementaryTitle.style.marginBottom = '20px';
    complementaryTitle.innerHTML = 'Informações Complementares';
    complementarySection.appendChild(complementaryTitle);

    // Observações
    const observationsContainer = document.createElement('div');
    observationsContainer.style.marginBottom = '20px';
    observationsContainer.innerHTML = `
      <div style="margin-bottom: 10px;"><strong>Observações:</strong></div>
      <div style="min-height: 80px; border: 1px solid #ddd; padding: 10px; margin-bottom: 20px;">
        ${serviceData.observations || ''}
      </div>
    `;
    complementarySection.appendChild(observationsContainer);

    // Assinaturas
    const signaturesSection = document.createElement('div');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    signaturesSection.style.display = 'flex';
    signaturesSection.style.justifyContent = 'space-between';
    signaturesSection.style.width = '100%';
    signaturesSection.style.marginTop = '10px';
    signaturesSection.style.marginBottom = '20px';
    signaturesSection.style.padding = '0 20px';

    const signatureStyle = `
      padding-top: 5px;
      text-align: center;
      width: 180px;
    `;

    signaturesSection.innerHTML = `
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${userData.signature ? `<img src="${userData.signature}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : ''}
          <div style="font-weight: bold; margin-top: 5px;">Controlador De Pragas</div>
          ${userData.name ? `<div style="font-size: 11px; margin-top: 2px;">${userData.name}</div>` : ''}
        </div>
      </div>
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${userData.tecnicoSignature ? `<img src="${userData.tecnicoSignature}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : ''}
          <div style="font-weight: bold; margin-top: 5px;">Responsável Técnico</div>
          ${userData.tecnicoName ? `<div style="font-size: 11px; margin-top: 2px;">${userData.tecnicoName}</div>` : ''}
          ${userData.tecnicoCrea ? `<div style="font-size: 11px; margin-top: 2px;">CREA ${userData.tecnicoCrea}</div>` : ''}
        </div>
      </div>
      <div style="flex: 1; max-width: 180px;">
        <div style="${signatureStyle}">
          ${clientData?.signature ? `<img src="${clientData.signature}" alt="Assinatura" style="width: 180px; height: 60px; margin-bottom: 5px; display: block;">` : ''}
          <div style="font-weight: bold; margin-top: 5px;">Contato Do Cliente</div>
          ${clientData?.contato ? `<div style="font-size: 11px; margin-top: 2px;">${clientData.contato}</div>` : ''}
        </div>
      </div>
    `;
    complementarySection.appendChild(signaturesSection);

    // Montar o conteúdo do relatório com containers de seção
    reportElement.innerHTML = `
      <div class="section-container">
        ${header.outerHTML}
        ${licensesContainer.outerHTML}
        ${divider.outerHTML}
        ${clientSection.outerHTML}
      </div>
      <div class="section-container">
        ${serviceSection.outerHTML}
        ${servicesInfoSection.outerHTML}
        ${serviceTable.outerHTML}
      </div>
      ${devicesSection ? `
        <div class="section-container">
          ${devicesSection.outerHTML}
        </div>
      ` : ''}
      <div class="section-container">
        ${complementarySection.outerHTML}
      </div>
    `;

    // Opções do PDF
    const pdfOptions = {
      margin: [10, 10, 10, 10],
      filename: `ordem-servico-${serviceData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794 // A4 width in pixels at 96 DPI
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    // Gerar o PDF
    const pdf = await html2pdf()
      .set(pdfOptions)
      .from(reportElement)
      .toPdf()
      .get('pdf');

    // Adicionar numeração de páginas no canto inferior direito
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.text(
        `${i}/${totalPages}`,
        pageWidth - 12,
        pageHeight - 8,
        { align: 'right' }
      );
    }

    // Salva no localStorage
    const pdfBlob = pdf.output('blob');
    storeServiceOrderPDF(pdfBlob, serviceData);

    // Retornar o blob do PDF
    return pdfBlob;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

export const generateCertificatePDF = async (serviceData: ServiceOrderPDFData) => {
  try {
    // Buscar dados da empresa do localStorage
    const companyDataStr = localStorage.getItem(COMPANY_STORAGE_KEY);
    let companyData: CompanyData = companyDataStr ? JSON.parse(companyDataStr) : {
      name: '',
      cnpj: '',
      address: '',
      phone: '',
      email: ''
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dateStr;
      }
    };

    // Template do certificado
    const certificateTemplate = `
      <div style="padding: 40px 60px; font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; font-size: 11px; page-break-after: avoid;">
        <!-- Cabeçalho -->
        <div style="margin-bottom: 40px;">
          <div style="width: 240px;">
            ${companyData.logoUrl ? `<img src="${companyData.logoUrl}" alt="Logo" style="width: 100%; height: auto;">` : ''}
          </div>
          <h1 style="color: #0066cc; font-size: 24px; margin: 20px 0 0; text-align: center;">CERTIFICADO</h1>
        </div>

        <!-- Texto do certificado -->
        <p style="text-align: justify; margin-bottom: 15px; line-height: 1.4;">
          Certificamos para os devidos fins que a empresa: ${serviceData.client.name}, situada à 
          ${serviceData.client.address}, CNPJ ${serviceData.client.document}, 
          encontra-se sob os serviços de controle de insetos e de roedores.
        </p>

        <p style="text-align: justify; margin-bottom: 15px; line-height: 1.4;">
          Informamos ainda que os tratamentos: desratizações, inspeções e aplicação de pesticidas são realizadas conforme 
          ordem de serviço em anexo. Estes Serviços são desenvolvidos pela ${companyData.name}, 
          onde utilizamos os produtos abaixo relacionados.
        </p>

        <p style="margin-bottom: 25px; line-height: 1.4;">
          Temos como estratégia de trabalho os métodos de iscagem, pulverização, atomização e polvilhamento.
        </p>

        <!-- Tabela de Serviços -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #0066cc; color: white;">
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 33%;">Serviço</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 33%;">Praga Alvo</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 33%;">Local</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${serviceData.serviceType || 'Controle de Pragas'}</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${serviceData.targetPests?.join(', ') || 'Insetos, Sinantrópicos'}</td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${serviceData.locations?.join(', ') || 'Área Interna, Área Externa'}</td>
          </tr>
        </table>

        <!-- Tabela de Produtos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <tr style="background-color: #0066cc; color: white;">
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 20%;">Produto</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 20%;">Registro</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 20%;">Praga Alvo</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 20%;">Ação Tóxica</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #fff; width: 20%;">Grupo Químico</th>
          </tr>
          ${serviceData.products?.map(product => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${product.name}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${product.registration || ''}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${product.targetPest || ''}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${product.toxicAction || ''}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${product.chemicalGroup || ''}</td>
            </tr>
          `).join('') || ''}
        </table>

        <!-- Informações de Registro -->
        <p style="margin-bottom: 8px; line-height: 1.4;">
          A ${companyData.name} encontra-se registrada nos órgãos competentes conforme dados abaixo:
        </p>
        <p style="margin-bottom: 5px; line-height: 1.4;">
          Licença Ambiental: ${companyData.environmentalLicense?.number || ''} Validade: ${formatDate(companyData.environmentalLicense?.date || '')}
        </p>
        <p style="margin-bottom: 20px; line-height: 1.4;">
          Alvará Sanitário: ${companyData.sanitaryPermit?.number || ''} Validade: ${formatDate(companyData.sanitaryPermit?.expiryDate || '')}
        </p>

        <!-- Datas -->
        <p style="margin-bottom: 5px; line-height: 1.4;">Data dos Serviços: ${formatDate(serviceData.serviceDate)}</p>
        <p style="margin-bottom: 5px; line-height: 1.4;">Validade deste Certificado: ${formatDate(serviceData.validUntil)}</p>
        <p style="margin-bottom: 40px; line-height: 1.4;">As datas dos serviços constam nas respectivas Ordens de Serviços.</p>

        <!-- Área de assinatura -->
        <div style="display: flex; justify-content: flex-end; margin: 20px 0;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 220px; padding-top: 5px;">
              <p style="margin: 0; line-height: 1.3;">BRUNO ALEXANDRE CORREA</p>
              <p style="margin: 0; line-height: 1.3;">RESPONSÁVEL TÉCNICO</p>
              <p style="margin: 0; line-height: 1.3;">CREA 161869/D</p>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div style="text-align: center; font-size: 10px; margin-top: 10px;">
          <p style="margin: 0; line-height: 1.3;">${companyData.name} - ${companyData.address} - CNPJ: ${companyData.cnpj}</p>
          <p style="margin: 0; line-height: 1.3;">Centro de Informação Toxicológica do Rio Grande do Sul - (51) 2139-9200 / 2139-9230</p>
          <p style="margin: 0; text-align: right;">0001</p>
        </div>
      </div>
    `;

    // Configurações do PDF
    const options = {
      margin: 0,
      filename: `certificado_${serviceData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1123, // A4 landscape width in pixels at 96 DPI
        height: 794 // A4 landscape height
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape',
        putOnlyUsedFonts: true,
        compress: true
      }
    };

    // Criar elemento temporário para o HTML
    const element = document.createElement('div');
    element.innerHTML = certificateTemplate;
    document.body.appendChild(element);

    // Gerar PDF
    const pdf = await html2pdf().from(element).set(options).save();

    // Remover elemento temporário
    document.body.removeChild(element);

    return pdf;
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
};

export const saveClientSignature = async (orderId: string, clientInfo: {
  name: string;
  phone: string;
  emails: string[];
  signature: string;
}) => {
  try {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (!savedOrders) return;

    const orders = JSON.parse(savedOrders);
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          clientInfo: {
            name: clientInfo.name,
            phone: clientInfo.phone,
            emails: clientInfo.emails,
            signature: clientInfo.signature,
            timestamp: new Date().toISOString()
          }
        };
        return updatedOrder;
      }
      return order;
    });

    localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    throw error;
  }
};

export const updateClientSignature = async (orderId: string, clientInfo: {
  name: string;
  phone: string;
  emails: string[];
  signature: string;
}) => {
  try {
    const savedOrders = localStorage.getItem('serviceOrders');
    if (!savedOrders) return;

    const orders = JSON.parse(savedOrders);
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          clientInfo: {
            name: clientInfo.name,
            contact: clientInfo.phone,
            email: clientInfo.emails.join(', '),
            signature: clientInfo.signature
          }
        };
        return updatedOrder;
      }
      return order;
    });

    localStorage.setItem('serviceOrders', JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
}