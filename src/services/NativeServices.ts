import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';

export class NativeServices {
  // Gerenciamento de arquivos PDF
  static async downloadPDF(url: string, fileName: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      const savedFile = await Filesystem.writeFile({
        path: `downloads/${fileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      return savedFile.uri;
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      throw error;
    }
  }

  // Compartilhamento de arquivos
  static async compartilharArquivo(titulo: string, texto: string, url?: string) {
    try {
      await Share.share({
        title: titulo,
        text: texto,
        url: url,
        dialogTitle: 'Compartilhar via'
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      throw error;
    }
  }

  // Armazenamento local
  static async salvarDadosLocais(chave: string, valor: any): Promise<void> {
    try {
      await Preferences.set({
        key: chave,
        value: JSON.stringify(valor)
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }
  }

  static async lerDadosLocais(chave: string): Promise<any> {
    try {
      const { value } = await Preferences.get({ key: chave });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erro ao ler dados:', error);
      throw error;
    }
  }

  // Notificações locais para eventos do calendário
  static async agendarNotificacao(titulo: string, corpo: string, dataHora: Date) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: titulo,
            body: corpo,
            id: new Date().getTime(),
            schedule: { at: dataHora },
            sound: null,
            attachments: null,
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      throw error;
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
