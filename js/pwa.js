// PWA Installation und Features
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupNotifications();
    this.handleURLParams();
    this.setupPeriodicSync();
  }

  // Service Worker registrieren
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Update verfügbar
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
        
        // Periodic Background Sync registrieren
        if ('periodicSync' in registration) {
          await registration.periodicSync.register('crochet-reminder', {
            minInterval: 24 * 60 * 60 * 1000, // 24 Stunden
          });
        }
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Install Prompt Setup
  setupInstallPrompt() {
    let installButton = document.getElementById('install-button');
    
    // Wenn kein Button existiert, erstelle einen
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.id = 'install-button';
      installButton.innerHTML = '📱 App installieren';
      installButton.className = 'install-button';
      installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        z-index: 1000;
        display: none;
        transition: all 0.3s ease;
        font-size: 14px;
      `;
      
      installButton.addEventListener('mouseenter', () => {
        installButton.style.transform = 'scale(1.05)';
        installButton.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
      });
      
      installButton.addEventListener('mouseleave', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
      });
      
      document.body.appendChild(installButton);
    }

    // beforeinstallprompt Event
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      installButton.style.display = 'block';
      
      // Analytics: Install prompt shown
      this.trackEvent('pwa_install_prompt_shown');
    });

    // Install Button Click
    installButton.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          this.showInstallSuccess();
          this.trackEvent('pwa_install_accepted');
        } else {
          console.log('User dismissed the install prompt');
          this.trackEvent('pwa_install_dismissed');
        }
        
        this.deferredPrompt = null;
        installButton.style.display = 'none';
      }
    });

    // appinstalled Event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      installButton.style.display = 'none';
      this.showInstallSuccess();
      this.trackEvent('pwa_installed');
    });
  }

  // Offline-Erkennung
  setupOfflineDetection() {
    const offlineIndicator = this.createOfflineIndicator();
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      offlineIndicator.style.display = 'none';
      this.showNotification('Verbindung wiederhergestellt! 🌐', 'success');
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      offlineIndicator.style.display = 'block';
      this.showNotification('Offline-Modus aktiviert 📱', 'info');
    });
    
    // Initial check
    if (!this.isOnline) {
      offlineIndicator.style.display = 'block';
    }
  }

  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.innerHTML = '📡 Offline-Modus - Alle Funktionen verfügbar';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      text-align: center;
      padding: 10px;
      font-weight: 600;
      z-index: 1001;
      display: none;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(indicator);
    return indicator;
  }

  // Push-Benachrichtigungen
  async setupNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Notification Permission
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.setupPushSubscription();
        }
      } else if (Notification.permission === 'granted') {
        this.setupPushSubscription();
      }
    }
  }

  async setupPushSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Prüfe, ob bereits ein Subscription existiert
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Erstelle neue Subscription
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrfueIoqEMmAczMDhvkSRCYFoLULrmKqNnl4F2TkwlXKNOLHNMa5x8';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }
      
      console.log('Push subscription:', subscription);
      
      // Lokale Speicherung der Subscription
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  // VAPID Key Konvertierung
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Periodic Background Sync
  async setupPeriodicSync() {
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      
      // Registriere tägliche Erinnerung
      try {
        await registration.periodicSync.register('crochet-reminder', {
          minInterval: 24 * 60 * 60 * 1000, // 24 Stunden
        });
        console.log('Periodic sync registered');
      } catch (error) {
        console.log('Periodic sync not supported:', error);
      }
    }
  }

  // URL Parameter handling
  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const pattern = urlParams.get('pattern');
    const rounds = urlParams.get('rounds');
    
    if (pattern && typeof window.switchPattern === 'function') {
      // Kurze Verzögerung für DOM-Initialisierung
      setTimeout(() => {
        window.switchPattern(pattern);
        
        if (rounds) {
          const roundsInput = document.getElementById('rounds');
          if (roundsInput) {
            roundsInput.value = rounds;
            if (typeof window.updateCalculation === 'function') {
              window.updateCalculation();
            }
          }
        }
      }, 100);
    }
  }

  // Benachrichtigungen anzeigen
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-left: 10px;
      ">×</button>
    `;
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      z-index: 1002;
      background: ${colors[type]};
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }

  showInstallSuccess() {
    this.showNotification('App erfolgreich installiert! 🎉', 'success', 5000);
  }

  showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.innerHTML = `
      <div style="margin-bottom: 10px;">📱 App-Update verfügbar!</div>
      <div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 10px;
        ">Später</button>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #3b82f6;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        ">Jetzt aktualisieren</button>
      </div>
    `;
    updateNotification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #3b82f6;
      color: white;
      padding: 15px;
      border-radius: 10px;
      z-index: 1002;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      max-width: 300px;
    `;
    
    document.body.appendChild(updateNotification);
  }

  // Offline-Daten synchronisieren
  async syncOfflineData() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }
  }

  // Web Share API
  async shareProject(project) {
    const shareData = {
      title: `Häkelprojekt: ${project.name}`,
      text: `Schaue dir mein Häkelprojekt an: ${project.pattern} mit ${project.rounds} Runden`,
      url: `${window.location.origin}/?pattern=${project.pattern}&rounds=${project.rounds}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        this.showNotification('Projekt geteilt! 📤', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Sharing failed:', error);
          this.fallbackShare(shareData);
        }
      }
    } else {
      this.fallbackShare(shareData);
    }
  }

  fallbackShare(shareData) {
    const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        this.showNotification('Projekt-Link kopiert! 📋', 'success');
      });
    } else {
      // Fallback für ältere Browser
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification('Projekt-Link kopiert! 📋', 'success');
    }
  }

  // Badge API
  updateBadge(count) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count);
    }
  }

  clearBadge() {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }

  // Analytics/Tracking
  trackEvent(eventName, properties = {}) {
    // Hier könnten Analytics-Events gesendet werden
    console.log('PWA Event:', eventName, properties);
    
    // Lokale Speicherung für Statistiken
    const events = JSON.parse(localStorage.getItem('pwa_events') || '[]');
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString()
    });
    
    // Nur die letzten 100 Events behalten
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('pwa_events', JSON.stringify(events));
  }

  // Performance Monitoring
  measurePerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const performanceData = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
      
      this.trackEvent('pwa_performance', performanceData);
    }
  }
}

// PWA initialisieren
document.addEventListener('DOMContentLoaded', () => {
  const pwaManager = new PWAManager();
  
  // Global verfügbar machen
  window.pwaManager = pwaManager;
  
  // Performance messen
  setTimeout(() => {
    pwaManager.measurePerformance();
  }, 1000);
});

// Unload Event für Cleanup
window.addEventListener('beforeunload', () => {
  if (window.pwaManager) {
    window.pwaManager.trackEvent('pwa_session_end');
  }
});

// Visibility API für App-Aktivität
document.addEventListener('visibilitychange', () => {
  if (window.pwaManager) {
    if (document.hidden) {
      window.pwaManager.trackEvent('pwa_app_hidden');
    } else {
      window.pwaManager.trackEvent('pwa_app_visible');
    }
  }
});
