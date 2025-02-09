import React, { useState } from 'react';
import { Database, RotateCw, Trash2, Upload, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Modal } from '../Modal';
import { STORAGE_KEYS, backupAllData, restoreBackup } from '../../services/storageKeys';
import { cleanupSystemData } from '../../services/ordemServicoService';

const BackupMaintenance = () => {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupData, setBackupData] = useState('');
  const [fileName, setFileName] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFileUpload({ target: { files: [file] } } as any);
    } else {
      toast.error('Por favor, selecione apenas arquivos .json');
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
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      toast.error('Erro ao fazer backup');
    }
  };

  const handleRestore = () => {
    setShowRestoreModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Tenta fazer o parse para verificar se é um JSON válido
          JSON.parse(content);
          setBackupData(content);
          setFileName(file.name);
        } catch (error) {
          toast.error('Arquivo inválido. Por favor, selecione um arquivo de backup JSON válido.');
          setBackupData('');
          setFileName('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreConfirm = async () => {
    try {
      setIsRestoring(true);
      setUploadProgress(0);
      
      // Simular progresso
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const backupObj = JSON.parse(backupData);
      await restoreBackup(backupObj);
      
      setUploadProgress(100);
      clearInterval(interval);
      
      setShowRestoreModal(false);
      setBackupData('');
      setFileName('');
      toast.success('Backup restaurado com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup. Verifique se o arquivo é válido.');
    } finally {
      setIsRestoring(false);
      setUploadProgress(0);
    }
  };

  const handleCleanupConfirm = async () => {
    try {
      setIsCleaningUp(true);
      
      // Lista de todas as chaves do localStorage que precisam ser limpas
      const keysToClean = [
        STORAGE_KEYS.SERVICE_ORDERS,
        STORAGE_KEYS.COMPANY,
        STORAGE_KEYS.CLIENTS,
        STORAGE_KEYS.PRODUCTS,
        'userData',
      ];

      // Limpar dados do sistema através do serviço
      await cleanupSystemData();

      // Limpar todas as chaves do localStorage
      keysToClean.forEach(key => {
        localStorage.removeItem(key);
      });

      // Limpar todo o localStorage
      localStorage.clear();

      // Limpar sessionStorage
      sessionStorage.clear();

      // Limpar cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      toast.success('Sistema limpo com sucesso! A página será recarregada.');
      setShowCleanupModal(false);
      
      // Delay antes de recarregar para garantir que o toast seja visto
      setTimeout(() => {
        window.location.href = '/'; // Redireciona para a página inicial
        window.location.reload(); // Recarrega a página
      }, 1500);
    } catch (error) {
      console.error('Erro ao limpar sistema:', error);
      toast.error('Erro ao limpar sistema');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleCloseModal = () => {
    setShowRestoreModal(false);
    setBackupData('');
    setFileName('');
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2"
          onClick={handleBackup}
        >
          <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
          Fazer Backup
        </Button>

        <Button
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2"
          onClick={handleRestore}
        >
          <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          Restaurar Backup
        </Button>

        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 sm:h-14 text-base sm:text-lg rounded-lg flex items-center justify-center gap-2"
            onClick={() => setShowCleanupModal(true)}
        >
          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Limpar Sistema
        </Button>

        <p className="text-sm sm:text-base text-gray-500 mt-2 text-center px-4">
          Atenção: Esta ação irá limpar todos os dados do sistema. Faça um backup antes de prosseguir.
        </p>
      </div>

        <Modal
        isOpen={showRestoreModal}
        onClose={handleCloseModal}
        title="Restaurar Backup do Sistema"
        >
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
            <p className="text-sm text-yellow-700">
              Atenção: Esta ação irá substituir todos os dados atuais do sistema.
              Certifique-se de que este é o backup correto antes de prosseguir.
            </p>
            </div>
          </div>
          </div>

          <div
          className={`flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed rounded-lg transition-colors
            ${fileName ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}
            hover:border-blue-500 cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          >
          <Upload className={`h-12 w-12 ${fileName ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-center">
            <label className="cursor-pointer">
            <span className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium inline-block">
              {fileName ? 'Trocar arquivo' : 'Selecionar arquivo .json'}
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            </label>
            <p className="text-sm text-gray-500 mt-2">
            ou arraste e solte o arquivo aqui
            </p>
          </div>
          </div>

          {fileName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Arquivo selecionado: {fileName}</span>
          </div>
          )}

          {isRestoring && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
            Restaurando backup... {uploadProgress}%
            </p>
          </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
          <button
            onClick={handleCloseModal}
            disabled={isRestoring}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRestoreConfirm}
            disabled={!backupData || isRestoring}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restaurando...' : 'Restaurar Backup'}
          </button>
          </div>
        </div>
        </Modal>

        <Modal
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          title="Limpar Sistema"
        >
          <div className="space-y-6 p-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-start">
            <AlertOctagon className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
              Atenção! Ação Irreversível
              </h3>
              <div className="mt-2 text-sm text-red-700">
              <p>Esta ação irá:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Apagar todos os dados do sistema</li>
                <li>Remover todas as ordens de serviço</li>
                <li>Excluir todos os registros de clientes</li>
                <li>Limpar configurações personalizadas</li>
              </ul>
              </div>
            </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3" />
            <p className="text-sm text-yellow-700">
              Recomendamos fortemente que você faça um backup dos dados antes de prosseguir com esta ação.
            </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Para confirmar a limpeza do sistema, digite "LIMPAR" no campo abaixo:</p>
            <input
            type="text"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Digite LIMPAR"
            value={cleanupConfirmText}
            onChange={(e) => setCleanupConfirmText(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
            onClick={() => setShowCleanupModal(false)}
            disabled={isCleaningUp}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
            Cancelar
            </button>
            <button
            onClick={handleCleanupConfirm}
            disabled={cleanupConfirmText !== 'LIMPAR' || isCleaningUp}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
            {isCleaningUp ? (
              <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                />
                <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Limpando...
              </>
            ) : (
              'Confirmar Limpeza'
            )}
            </button>
          </div>
          </div>
        </Modal>
      </>
  );
};

export default BackupMaintenance;
