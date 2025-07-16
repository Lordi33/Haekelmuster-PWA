// IndexedDB für lokale Datenspeicherung
class CrochetDB {
  constructor() {
    this.dbName = 'CrochetPatternDB';
    this.version = 1;
    this.db = null;
    this.isReady = false;
    
    this.init();
  }

  async init() {
    try {
      this.db = await this.openDB();
      this.isReady = true;
      console.log('IndexedDB initialized successfully');
      
      // Event dispatchen für andere Komponenten
      document.dispatchEvent(new CustomEvent('dbReady'));
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Projects Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', {
            keyPath: 'id',
            autoIncrement: true
          });
          
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('pattern', 'pattern', { unique: false });
          projectStore.createIndex('created', 'created', { unique: false });
          projectStore.createIndex('modified', 'modified', { unique: false });
        }
        
        // Patterns Store (für benutzerdefinierte Muster)
        if (!db.objectStoreNames.contains('customPatterns')) {
          const patternStore = db.createObjectStore('customPatterns', {
            keyPath: 'id',
            autoIncrement: true
          });
          
          patternStore.createIndex('name', 'name', { unique: false });
          patternStore.createIndex('type', 'type', { unique: false });
          patternStore.createIndex('created', 'created', { unique: false });
        }
        
        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', {
            keyPath: 'key'
          });
        }
        
        // Statistics Store
        if (!db.objectStoreNames.contains('statistics')) {
          const statsStore = db.createObjectStore('statistics', {
            keyPath: 'id',
            autoIncrement: true
          });
          
          statsStore.createIndex('date', 'date', { unique: false });
          statsStore.createIndex('pattern', 'pattern', { unique: false });
        }
      };
    });
  }

  // Projekte speichern
  async saveProject(project) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    const projectData = {
      ...project,
      created: project.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      version: '1.0'
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(projectData);
      request.onsuccess = () => {
        // Statistik aktualisieren
        this.updateStatistics('project_saved', project.pattern);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Projekte laden
  async loadProjects() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Nach Änderungsdatum sortieren (neueste zuerst)
        const projects = request.result.sort((a, b) => 
          new Date(b.modified) - new Date(a.modified)
        );
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Projekt nach ID laden
  async loadProject(id) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Projekt aktualisieren
  async updateProject(project) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    const projectData = {
      ...project,
      modified: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(projectData);
      request.onsuccess = () => {
        this.updateStatistics('project_updated', project.pattern);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Projekt löschen
  async deleteProject(id) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        this.updateStatistics('project_deleted');
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Projekte nach Muster suchen
  async searchProjectsByPattern(pattern) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const index = store.index('pattern');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(pattern);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Benutzerdefinierte Muster speichern
  async saveCustomPattern(pattern) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['customPatterns'], 'readwrite');
    const store = transaction.objectStore('customPatterns');
    
    const patternData = {
      ...pattern,
      created: new Date().toISOString(),
      version: '1.0'
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(patternData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Benutzerdefinierte Muster laden
  async loadCustomPatterns() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['customPatterns'], 'readonly');
    const store = transaction.objectStore('customPatterns');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Einstellungen speichern
  async saveSetting(key, value) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    const setting = { 
      key, 
      value, 
      modified: new Date().toISOString() 
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(setting);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Einstellungen laden
  async loadSetting(key) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Alle Einstellungen laden
  async loadAllSettings() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(setting => {
          settings[setting.key] = setting.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Statistiken aktualisieren
  async updateStatistics(action, pattern = null) {
    if (!this.isReady) {
      return;
    }

    const transaction = this.db.transaction(['statistics'], 'readwrite');
    const store = transaction.objectStore('statistics');
    
    const statData = {
      date: new Date().toISOString(),
      action,
      pattern,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(statData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Statistiken laden
  async loadStatistics(days = 30) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['statistics'], 'readonly');
    const store = transaction.objectStore('statistics');
    const index = store.index('date');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.lowerBound(cutoffDate.toISOString()));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Daten exportieren
  async exportData() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const [projects, customPatterns, settings] = await Promise.all([
      this.loadProjects(),
      this.loadCustomPatterns(),
      this.loadAllSettings()
    ]);

    return {
      projects,
      customPatterns,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Daten importieren
  async importData(data) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const transaction = this.db.transaction(['projects', 'customPatterns', 'settings'], 'readwrite');
    
    try {
      // Projekte importieren
      if (data.projects) {
        const projectStore = transaction.objectStore('projects');
        for (const project of data.projects) {
          // ID entfernen für neue Einträge
          const { id, ...projectData } = project;
          await new Promise((resolve, reject) => {
            const request = projectStore.add(projectData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }

      // Benutzerdefinierte Muster importieren
      if (data.customPatterns) {
        const patternStore = transaction.objectStore('customPatterns');
        for (const pattern of data.customPatterns) {
          const { id, ...patternData } = pattern;
          await new Promise((resolve, reject) => {
            const request = patternStore.add(patternData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }

      // Einstellungen importieren
      if (data.settings) {
        const settingsStore = transaction.objectStore('settings');
        for (const [key, value] of Object.entries(data.settings)) {
          await new Promise((resolve, reject) => {
            const request = settingsStore.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }

      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Datenbank bereinigen (alte Einträge löschen)
  async cleanupDatabase(daysToKeep = 90) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    // Alte Statistiken löschen
    const transaction = this.db.transaction(['statistics'], 'readwrite');
    const store = transaction.objectStore('statistics');
    const index = store.index('date');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffString));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Datenbank-Größe schätzen
  async estimateSize() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    if ('estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    
    return { usage: 0, quota: 0 };
  }

  // Datenbank-Status
  getStatus() {
    return {
      isReady: this.isReady,
      dbName: this.dbName,
      version: this.version,
      supported: 'indexedDB' in window
    };
  }
}

// Singleton-Instanz
const crochetDB = new CrochetDB();

// Global verfügbar machen
window.crochetDB = crochetDB;

// Event-basierte Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  // Periodische Bereinigung (einmal pro Woche)
  const lastCleanup = localStorage.getItem('lastDbCleanup');
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  
  if (!lastCleanup || (now - parseInt(lastCleanup)) > oneWeek) {
    crochetDB.cleanupDatabase().then(() => {
      localStorage.setItem('lastDbCleanup', now.toString());
      console.log('Database cleanup completed');
    }).catch(error => {
      console.error('Database cleanup failed:', error);
    });
  }
});
