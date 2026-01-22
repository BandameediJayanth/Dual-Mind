/**
 * StorageManager - Data Persistence Layer
 * Handles LocalStorage and IndexedDB operations
 */

export class StorageManager {
    constructor() {
        this.dbName = 'GameSuiteDB';
        this.dbVersion = 1;
        this.db = null;
        this.useIndexedDB = this.checkIndexedDBSupport();
    }

    /**
     * Check if IndexedDB is supported
     * @returns {boolean}
     */
    checkIndexedDBSupport() {
        return 'indexedDB' in window;
    }

    /**
     * Initialize IndexedDB connection
     * @returns {Promise<IDBDatabase>}
     */
    async initDB() {
        if (!this.useIndexedDB) {
            console.log('IndexedDB not supported, using LocalStorage');
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                this.useIndexedDB = false;
                resolve(null);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('📦 IndexedDB connected');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    sessionsStore.createIndex('timestamp', 'timestamp');
                    sessionsStore.createIndex('gameId', 'gameId');
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains('stats')) {
                    db.createObjectStore('stats', { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains('iqTrends')) {
                    const trendsStore = db.createObjectStore('iqTrends', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    trendsStore.createIndex('timestamp', 'timestamp');
                }

                console.log('📦 IndexedDB schema created');
            };
        });
    }

    /**
     * Get data by key
     * @param {string} key - Storage key
     * @returns {Promise<any>}
     */
    async get(key) {
        // Try IndexedDB first
        if (this.db) {
            try {
                return await this.getFromDB(key);
            } catch (error) {
                console.warn('IndexedDB get failed, falling back to LocalStorage:', error);
            }
        }

        // Fallback to LocalStorage
        return this.getFromLocalStorage(key);
    }

    /**
     * Get data from IndexedDB
     * @param {string} key - Storage key
     * @returns {Promise<any>}
     */
    async getFromDB(key) {
        return new Promise((resolve, reject) => {
            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);

            if (storeName === 'sessions' || storeName === 'iqTrends') {
                // Get all records
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                // Get single record
                const request = store.get(key);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : null);
                };
                request.onerror = () => reject(request.error);
            }
        });
    }

    /**
     * Get data from LocalStorage
     * @param {string} key - Storage key
     * @returns {any}
     */
    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`gamesuite_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return null;
        }
    }

    /**
     * Set data by key
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @returns {Promise<void>}
     */
    async set(key, value) {
        // Try IndexedDB first
        if (this.db) {
            try {
                await this.setInDB(key, value);
                return;
            } catch (error) {
                console.warn('IndexedDB set failed, falling back to LocalStorage:', error);
            }
        }

        // Fallback to LocalStorage
        this.setInLocalStorage(key, value);
    }

    /**
     * Set data in IndexedDB
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @returns {Promise<void>}
     */
    async setInDB(key, value) {
        return new Promise((resolve, reject) => {
            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            let request;

            if (storeName === 'sessions' || storeName === 'iqTrends') {
                // Clear and add all
                store.clear();
                if (Array.isArray(value)) {
                    value.forEach(item => store.add(item));
                }
                resolve();
            } else {
                // Put single record
                request = store.put({ key, value });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }
        });
    }

    /**
     * Set data in LocalStorage
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     */
    setInLocalStorage(key, value) {
        try {
            localStorage.setItem(`gamesuite_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('LocalStorage set error:', error);
            
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, clearing old data');
                this.clearOldData();
            }
        }
    }

    /**
     * Delete data by key
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async delete(key) {
        if (this.db) {
            try {
                await this.deleteFromDB(key);
            } catch (error) {
                console.warn('IndexedDB delete failed:', error);
            }
        }

        localStorage.removeItem(`gamesuite_${key}`);
    }

    /**
     * Delete data from IndexedDB
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async deleteFromDB(key) {
        return new Promise((resolve, reject) => {
            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clear() {
        // Clear IndexedDB
        if (this.db) {
            const storeNames = ['sessions', 'settings', 'stats', 'iqTrends'];
            
            for (const storeName of storeNames) {
                try {
                    await new Promise((resolve, reject) => {
                        const transaction = this.db.transaction(storeName, 'readwrite');
                        const store = transaction.objectStore(storeName);
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                } catch (error) {
                    console.warn(`Failed to clear ${storeName}:`, error);
                }
            }
        }

        // Clear LocalStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('gamesuite_')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('📦 All data cleared');
    }

    /**
     * Export all data
     * @returns {Promise<Object>}
     */
    async exportAll() {
        const data = {
            settings: await this.get('settings'),
            stats: await this.get('stats'),
            sessions: await this.get('sessions'),
            iqTrends: await this.get('iqTrends'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return data;
    }

    /**
     * Import data
     * @param {Object} data - Data to import
     * @returns {Promise<void>}
     */
    async importData(data) {
        if (data.settings) await this.set('settings', data.settings);
        if (data.stats) await this.set('stats', data.stats);
        if (data.sessions) await this.set('sessions', data.sessions);
        if (data.iqTrends) await this.set('iqTrends', data.iqTrends);

        console.log('📦 Data imported');
    }

    /**
     * Get store name for a key
     * @param {string} key - Storage key
     * @returns {string} Store name
     */
    getStoreName(key) {
        const storeMap = {
            sessions: 'sessions',
            iqTrends: 'iqTrends',
            settings: 'settings',
            stats: 'stats'
        };

        return storeMap[key] || 'settings';
    }

    /**
     * Clear old data to free up space
     */
    async clearOldData() {
        // Keep only recent sessions
        const sessions = await this.get('sessions');
        if (sessions && sessions.length > 50) {
            const recentSessions = sessions.slice(-50);
            await this.set('sessions', recentSessions);
        }

        // Keep only recent IQ trends
        const trends = await this.get('iqTrends');
        if (trends && trends.length > 100) {
            const recentTrends = trends.slice(-100);
            await this.set('iqTrends', recentTrends);
        }
    }

    /**
     * Get storage usage info
     * @returns {Object} Storage usage
     */
    getStorageInfo() {
        let localStorageUsed = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('gamesuite_')) {
                localStorageUsed += localStorage.getItem(key).length;
            }
        }

        return {
            localStorageUsed: `${(localStorageUsed / 1024).toFixed(2)} KB`,
            indexedDBAvailable: this.useIndexedDB,
            dbConnected: !!this.db
        };
    }
}
