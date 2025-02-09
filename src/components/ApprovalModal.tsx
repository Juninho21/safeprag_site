import React, { useState, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { SignatureCanvas, SignatureCanvasRef } from './SignatureCanvas';
import { saveClientSignature } from '../services/pdfService';
import { useNotification } from '../contexts/NotificationContext';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onSave?: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);
  const [signature, setSignature] = useState('');
  const [isWritingDisabled, setIsWritingDisabled] = useState(false);

  const signatureRef = useRef<SignatureCanvasRef>(null);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        emails: emails.filter(email => email.trim() !== ''),
        signature,
        contato: name.trim(),
      };

      // Salvar no localStorage
      localStorage.setItem('client_signature_data', JSON.stringify(data));

      if (onSave) {
        onSave();
      }

      // Limpar campos
      setName('');
      setPhone('');
      setEmails(['']);
      setSignature('');
      setIsWritingDisabled(false);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    if (newEmails.length === 0) {
      setEmails(['']);
    } else {
      setEmails(newEmails);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Aprovação de Serviço
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-800 text-base font-medium leading-relaxed">
            Estou de acordo com o serviço realizado e tenho ciência sobre as informações contidas
            neste relatório.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900">Confirmação dos Dados</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Digite seu telefone"
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="Digite seu e-mail"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-800">
                Assinatura
              </label>
              <button
                type="button"
                onClick={() => setIsWritingDisabled(!isWritingDisabled)}
                className={`px-4 py-2 ${
                  isWritingDisabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white text-sm rounded-md transition-colors font-medium`}
              >
                {isWritingDisabled ? 'Habilitar Escrita' : 'Desabilitar Escrita'}
              </button>
            </div>
            <div className="border border-gray-300 rounded-md bg-white">
              <SignatureCanvas
                ref={signatureRef}
                disabled={isWritingDisabled}
                onSignatureChange={setSignature}
              />
            </div>
            <button
              type="button"
              onClick={handleClearSignature}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Limpar Assinatura
            </button>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-base"
              disabled={!name || !phone || !signature || !emails[0]}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
