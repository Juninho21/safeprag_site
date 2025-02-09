import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export class NativeService {
  private static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Calendário (compatível com web e mobile)
  static async addEventToCalendar(title: string, startDate: Date, endDate: Date, notes?: string) {
    try {
      if (this.isNativePlatform()) {
        const calendarUrl = `content://com.android.calendar/time/${startDate.getTime()}`;
        await App.openUrl({ url: calendarUrl });
      } else {
        // Fallback para web usando API do Google Calendar
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(notes || '')}`;
        window.open(googleCalendarUrl, '_blank');
      }
      return true;
    } catch (error) {
      console.error('Erro ao manipular calendário:', error);
      return false;
    }
  }

  // Download e gerenciamento de arquivos PDF
  static async downloadPDF(url: string, fileName: string) {
    try {
      if (this.isNativePlatform()) {
        const response = await fetch(url);
        const blob = await response.blob();
        const base64Data = await this.blobToBase64(blob);

        await Filesystem.writeFile({
          path: `downloads/${fileName}`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
      } else {
        // Fallback para web usando download nativo do navegador
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }
      return true;
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      return false;
    }
  }

  // Compartilhamento de arquivos
  static async shareFile(filePath: string, title: string) {
    try {
      if (this.isNativePlatform()) {
        const fileContent = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Documents
        });

        await Share.share({
          title,
          text: 'Compartilhado via SafePrag',
          url: fileContent.uri,
          dialogTitle: 'Compartilhar arquivo'
        });
      } else {
        // Fallback para web usando Web Share API
        if (navigator.share) {
          await navigator.share({
            title,
            text: 'Compartilhado via SafePrag',
            url: filePath
          });
        } else {
          // Fallback para cópia para área de transferência
          await navigator.clipboard.writeText(filePath);
          alert('Link copiado para a área de transferência!');
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar arquivo:', error);
      return false;
    }
  }

  // Armazenamento local
  static async saveData(key: string, value: any) {
    try {
      if (this.isNativePlatform()) {
        await Preferences.set({
          key,
          value: JSON.stringify(value)
        });
      } else {
        // Fallback para localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  }

  static async getData(key: string) {
    try {
      if (this.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback para localStorage
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
      return null;
    }
  }

  // Notificações locais
  static async scheduleNotification(title: string, body: string, scheduleDate: Date) {
    try {
      if (this.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: new Date().getTime(),
              schedule: { at: scheduleDate }
            }
          ]
        });
      } else {
        // Fallback para Notification API do navegador
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Agendar notificação usando setTimeout
            const delay = scheduleDate.getTime() - Date.now();
            if (delay > 0) {
              setTimeout(() => {
                new Notification(title, { body });
              }, delay);
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return false;
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Erro ao converter blob para base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
