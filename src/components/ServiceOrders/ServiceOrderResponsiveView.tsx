import React from 'react';
import { DataGrid } from '../ui/data-grid';
import { Button } from '../ui/button';

interface ServiceOrderResponsiveViewProps {
  data: any[];
  onViewServiceOrder: (orderNumber: string) => void;
  onViewCertificate: (orderNumber: string) => void;
}

export const ServiceOrderResponsiveView: React.FC<ServiceOrderResponsiveViewProps> = ({
  data,
  onViewServiceOrder,
  onViewCertificate,
}) => {
  // Colunas para desktop
  const desktopColumns = [
    { field: 'numOS', headerName: 'Num. O.S.', width: 150 },
    { field: 'jde', headerName: 'Código do Cliente', width: 150 },
    { field: 'nomeFantasia', headerName: 'Nome Fantasia', width: 200 },
    { field: 'cadeia', headerName: 'Razão Social', width: 200 },
    { field: 'inicio', headerName: 'Data', width: 150 },
    { field: 'tecnico', headerName: 'Controlador de Pragas', width: 200 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 200,
      renderCell: (params: any) => (
        <div className="space-x-2">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => onViewServiceOrder(params.row.numOS)}
            size="sm"
          >
            Ordem de Serviço
          </Button>
          {(params.row.status === 'CERTIFICADO' || params.row.hasCertificate) && (
            <Button 
              variant="success"
              onClick={() => onViewCertificate(params.row.numOS)}
              size="sm"
            >
              Certificado
            </Button>
          )}
        </div>
      )
    }
  ];

  // Visualização para dispositivos móveis
  const renderMobileView = () => (
    <div className="space-y-4 md:hidden">
      {data.map((order) => (
        <div 
          key={order.numOS}
          className="bg-white rounded-lg shadow p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-gray-900">OS #{order.numOS}</div>
              <div className="text-sm text-gray-600">{order.nomeFantasia}</div>
            </div>
            <div className="text-sm text-gray-500">{order.inicio}</div>
          </div>
          
          <div className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-500">Código:</div>
              <div>{order.jde}</div>
              <div className="text-gray-500">Razão Social:</div>
              <div>{order.cadeia}</div>
              <div className="text-gray-500">Controlador:</div>
              <div>{order.tecnico}</div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
              onClick={() => onViewServiceOrder(order.numOS)}
              size="sm"
            >
              Ordem de Serviço
            </Button>
            {(order.status === 'CERTIFICADO' || order.hasCertificate) && (
              <Button 
                variant="success"
                onClick={() => onViewCertificate(order.numOS)}
                size="sm"
                className="flex-1"
              >
                Certificado
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Visualização móvel */}
      {renderMobileView()}

      {/* Visualização desktop - esconde em telas pequenas */}
      <div className="hidden md:block">
        <DataGrid
          rows={data}
          columns={desktopColumns}
          getRowId={(row) => row.numOS}
          pageSize={100}
          localeText={{
            noRowsLabel: 'Nenhuma ordem de serviço encontrada',
            footerRowSelected: (count) => `${count} ordem${count !== 1 ? 's' : ''} selecionada${count !== 1 ? 's' : ''}`
          }}
        />
      </div>
    </div>
  );
};
