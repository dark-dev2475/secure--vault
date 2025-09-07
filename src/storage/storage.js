// IndexedDB storage manager for encrypted vault

const DB_NAME = 'secure-shelf-db';
const DB_VERSION = 1;
const VAULT_STORE = 'vault';
const SETTINGS_STORE = 'settings';

/**
 * Opens the IndexedDB database connection
 * @returns {Promise<IDBDatabase>} A promise that resolves to the database connection
 */
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('Error opening database: ' + event.target.error);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(VAULT_STORE)) {
        db.createObjectStore(VAULT_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves encrypted data to the vault store
 * @param {Object} data - The encrypted data to save
 * @returns {Promise<void>}
 */
export async function saveToVault(data) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VAULT_STORE], 'readwrite');
    const store = transaction.objectStore(VAULT_STORE);
    
    const request = store.put(data);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject('Error saving to vault: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Retrieves encrypted data from the vault store
 * @param {string} id - The ID of the item to retrieve
 * @returns {Promise<Object>} A promise that resolves to the encrypted data
 */
export async function getFromVault(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VAULT_STORE], 'readonly');
    const store = transaction.objectStore(VAULT_STORE);
    
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject('Error retrieving from vault: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Retrieves all items from the vault store
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of encrypted data
 */
export async function getAllFromVault() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VAULT_STORE], 'readonly');
    const store = transaction.objectStore(VAULT_STORE);
    
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject('Error retrieving all from vault: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Removes an item from the vault store
 * @param {string} id - The ID of the item to remove
 * @returns {Promise<void>}
 */
export async function removeFromVault(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VAULT_STORE], 'readwrite');
    const store = transaction.objectStore(VAULT_STORE);
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject('Error removing from vault: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Saves settings to the settings store
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    const request = store.put(settings);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject('Error saving settings: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Retrieves settings from the settings store
 * @param {string} id - The ID of the settings to retrieve
 * @returns {Promise<Object>} A promise that resolves to the settings
 */
export async function getSettings(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject('Error retrieving settings: ' + event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}
