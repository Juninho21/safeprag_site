export interface ServiceOrderPDFData {
  orderNumber: string;
  client: {
    name: string;
    document: string;
    address: string;
    branch: string;
  };
  serviceType: string;
  targetPests: string[];
  locations: string[];
  products: Array<{
    name: string;
    registration?: string;
    targetPest?: string;
    toxicAction?: string;
    chemicalGroup?: string;
  }>;
  serviceDate: string;
  validUntil: string;
}
