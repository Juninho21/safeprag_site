import React, { useState, useEffect } from 'react';
import { NativeServices } from '../services/NativeServices';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DocumentoNativo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [documentos, setDocumentos] = useState<Array<{ nome: string, url: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDocumentosSalvos();
  }, []);

  const carregarDocumentosSalvos = async () => {
    try {
      const docs = await NativeServices.lerDadosLocais('documentos');
      if (docs) {
        setDocumentos(JSON.parse(docs));
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleDownloadPDF = async (url: string, nome: string) => {
    try {
      setLoading(true);
      const fileUri = await NativeServices.downloadPDF(url, nome);
      
      // Salvar referência do documento localmente
      const novoDoc = { nome, url: fileUri };
      const docsAtualizados = [...documentos, novoDoc];
      setDocumentos(docsAtualizados);
      await NativeServices.salvarDadosLocais('documentos', JSON.stringify(docsAtualizados));

      alert('Documento baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('Erro ao baixar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleCompartilhar = async (documento: { nome: string, url: string }) => {
    try {
      await NativeServices.compartilharArquivo(
        'Compartilhar Documento',
        `Compartilhando ${documento.nome}`,
        documento.url
      );
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      alert('Erro ao compartilhar documento');
    }
  };

  const handleAgendarLembrete = async () => {
    if (selectedDate) {
      try {
        await NativeServices.agendarNotificacao(
          'Lembrete de Documento',
          'Você tem um documento para revisar hoje!',
          selectedDate
        );
        alert('Lembrete agendado com sucesso!');
      } catch (error) {
        console.error('Erro ao agendar lembrete:', error);
        alert('Erro ao agendar lembrete');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciador de Documentos</h1>

      {/* Seção de Download */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">Download de Documentos</h2>
        <button
          onClick={() => handleDownloadPDF('URL_DO_SEU_PDF', 'documento.pdf')}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Baixando...' : 'Baixar PDF'}
        </button>
      </div>

      {/* Lista de Documentos */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">Documentos Baixados</h2>
        <div className="space-y-2">
          {documentos.map((doc, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
              <span>{doc.nome}</span>
              <button
                onClick={() => handleCompartilhar(doc)}
                className="bg-green-500 text-white px-2 py-1 rounded text-sm"
              >
                Compartilhar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calendário */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">Agendar Lembrete</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
          />
          {selectedDate && (
            <div className="mt-4">
              <p>Data selecionada: {format(selectedDate, 'dd/MM/yyyy')}</p>
              <button
                onClick={handleAgendarLembrete}
                className="bg-purple-500 text-white px-4 py-2 rounded mt-2"
              >
                Agendar Lembrete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
