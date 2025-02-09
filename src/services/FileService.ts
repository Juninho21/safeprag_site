import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export class FileService {
  static async savePDF(pdfBlob: Blob, fileName: string): Promise<string> {
    try {
      // Converter Blob para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64Data = reader.result as string;
          // Remove o cabeçalho do base64 se existir
          const pdfData = base64Data.replace(/^data:application\/pdf;base64,/, '');
          resolve(pdfData);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(pdfBlob);
      const pdfData = await base64Promise;

      // Salva o arquivo no dispositivo
      const result = await Filesystem.writeFile({
        path: `${fileName}.pdf`,
        data: pdfData,
        directory: Directory.Documents,
        recursive: true,
        encoding: Encoding.UTF8
      });

      return result.uri;
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      throw error;
    }
  }

  static async shareFile(fileUri: string): Promise<void> {
    try {
      await Filesystem.getInfo({
        path: fileUri,
        directory: Directory.Documents
      });

      // Aqui você pode implementar o compartilhamento usando outro plugin do Capacitor
      // Por exemplo, usando @capacitor/share
    } catch (error) {
      console.error('Erro ao compartilhar arquivo:', error);
      throw error;
    }
  }
}
