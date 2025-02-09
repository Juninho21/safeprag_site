// Chaves para armazenamento no localStorage
const COMPANY_STORAGE_KEY = 'companyData';
const COMPANY_LOGO_KEY = 'companyLogo';

export interface CompanyData {
  id?: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logo?: string; // Base64 da imagem
  createdAt?: string;
  updatedAt?: string;
}

// Função para salvar os dados da empresa
export const saveCompanyToLocalStorage = async (data: CompanyData, logoFile?: File | null): Promise<CompanyData> => {
  try {
    const company = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Se houver um novo logo, converte para base64
    if (logoFile) {
      const base64Logo = await convertFileToBase64(logoFile);
      company.logo = base64Logo;
      localStorage.setItem(COMPANY_LOGO_KEY, base64Logo);
    }

    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    console.log('Empresa salva com sucesso');
    
    return company;
  } catch (error) {
    console.error('Erro ao salvar empresa:', error);
    throw new Error('Erro ao salvar dados da empresa');
  }
};

// Função para carregar os dados da empresa
export const loadCompanyFromLocalStorage = (): CompanyData | null => {
  try {
    const companyData = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (!companyData) return null;

    const company = JSON.parse(companyData);
    const logo = localStorage.getItem(COMPANY_LOGO_KEY);
    
    return {
      ...company,
      logo: logo || company.logo
    };
  } catch (error) {
    console.error('Erro ao carregar empresa:', error);
    return null;
  }
};

// Função para deletar os dados da empresa
export const deleteCompanyFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    localStorage.removeItem(COMPANY_LOGO_KEY);
    console.log('Dados da empresa deletados com sucesso');
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    throw new Error('Erro ao deletar dados da empresa');
  }
};

// Função auxiliar para converter File para base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
