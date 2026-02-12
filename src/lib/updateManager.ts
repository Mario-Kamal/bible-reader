/**
 * Update Manager - يتعامل مع التحديثات التلقائية للتطبيق
 */

export interface AppVersion {
  version: string;
  timestamp: number;
  buildHash: string;
}

const VERSION_CHECK_INTERVAL = 60 * 60 * 1000; // كل ساعة
const VERSION_ENDPOINT = '/version.json';

export class UpdateManager {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private onUpdateAvailableCallback: (() => void) | null = null;

  /**
   * ابدأ مراقبة التحديثات
   */
  start(onUpdateAvailable?: () => void) {
    if (onUpdateAvailable) {
      this.onUpdateAvailableCallback = onUpdateAvailable;
    }

    // تحقق مباشرة عند البدء
    this.checkForUpdates();

    // ثم تحقق بشكل دوري
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkForUpdates();
      }, VERSION_CHECK_INTERVAL);
    }
  }

  /**
   * أوقف مراقبة التحديثات
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * تحقق من وجود تحديث جديد
   */
  private async checkForUpdates() {
    try {
      // احصل على الإصدار الحالي من localStorage
      const currentVersion = this.getCurrentVersion();
      
      // احصل على الإصدار الجديد من السيرفر
      const response = await fetch(VERSION_ENDPOINT, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.warn('Failed to fetch version info');
        return;
      }

      const newVersionData: AppVersion = await response.json();

      console.log('Current version:', currentVersion);
      console.log('Available version:', newVersionData);

      // إذا كان هناك إصدار جديد
      if (!currentVersion || newVersionData.timestamp > currentVersion.timestamp) {
        console.log('تحديث جديد متاح!');
        
        // احفظ الإصدار الجديد
        this.saveVersion(newVersionData);
        
        // استدعِ التنبيه
        if (this.onUpdateAvailableCallback) {
          this.onUpdateAvailableCallback();
        }

        // أعد تحميل الصفحة بعد تأخير قصير
        // (حتى يكتمل تحميل service worker)
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * احصل على الإصدار المحفوظ
   */
  private getCurrentVersion(): AppVersion | null {
    const stored = localStorage.getItem('appVersion');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * احفظ الإصدار الجديد
   */
  private saveVersion(version: AppVersion) {
    localStorage.setItem('appVersion', JSON.stringify(version));
  }

  /**
   * احصل على معلومات الإصدار الحالي
   */
  getVersion(): AppVersion | null {
    return this.getCurrentVersion();
  }
}

export const updateManager = new UpdateManager();
