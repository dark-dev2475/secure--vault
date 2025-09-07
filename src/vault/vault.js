// Vault manager for encryption/decryption operations

import { deriveKey, encryptData, decryptData } from '../crypto/crypto.js';
import { 
  saveToVault, 
  getFromVault, 
  getAllFromVault, 
  removeFromVault, 
  saveSettings, 
  getSettings 
} from '../storage/storage.js';

// Settings constants
const VAULT_METADATA_ID = 'vault-metadata';
const SALT_SETTING_ID = 'vault-salt';

// In-memory state (cleared when extension is unloaded)
let masterKey = null;
let isVaultLocked = true;
let vaultTimeout = null;

/**
 * Initializes the vault on first use
 * @param {string} masterPassword - The master password to set
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export async function initializeVault(masterPassword) {
  try {
    // Generate a random salt for key derivation
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Save the salt (not secret, just needs to be consistent)
    await saveSettings({
      id: SALT_SETTING_ID,
      salt: Array.from(salt)
    });
    
    // Create vault metadata
    const metadata = {
      id: VAULT_METADATA_ID,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1
    };
    
    // Derive the master key
    masterKey = await deriveKey(masterPassword, salt);
    
    // Encrypt and save the metadata as a verification
    const encryptedMetadata = await encryptData(masterKey, JSON.stringify(metadata));
    await saveToVault({
      id: VAULT_METADATA_ID,
      data: encryptedMetadata
    });
    
    isVaultLocked = false;
    return true;
  } catch (error) {
    console.error('Error initializing vault:', error);
    return false;
  }
}

/**
 * Checks if the vault has been initialized
 * @returns {Promise<boolean>} Whether the vault has been initialized
 */
export async function isVaultInitialized() {
  try {
    const metadata = await getFromVault(VAULT_METADATA_ID);
    return !!metadata;
  } catch (error) {
    return false;
  }
}

/**
 * Unlocks the vault with the master password
 * @param {string} masterPassword - The master password
 * @param {number} autoLockTimeout - Time in minutes to auto-lock the vault (0 for no auto-lock)
 * @returns {Promise<boolean>} Whether unlocking was successful
 */
export async function unlockVault(masterPassword, autoLockTimeout = 5) {
  try {
    // Get the salt
    const saltSetting = await getSettings(SALT_SETTING_ID);
    if (!saltSetting) {
      return false;
    }
    
    const salt = new Uint8Array(saltSetting.salt);
    
    // Derive the key
    masterKey = await deriveKey(masterPassword, salt);
    
    // Try to decrypt the metadata as verification
    const encryptedMetadata = await getFromVault(VAULT_METADATA_ID);
    if (!encryptedMetadata) {
      return false;
    }
    
    try {
      const metadataString = await decryptData(
        masterKey,
        encryptedMetadata.data.iv,
        encryptedMetadata.data.ciphertext
      );
      JSON.parse(metadataString); // Verify it's valid JSON
      
      // Update last access time
      const metadata = JSON.parse(metadataString);
      metadata.lastAccessed = new Date().toISOString();
      const updatedEncryptedMetadata = await encryptData(masterKey, JSON.stringify(metadata));
      await saveToVault({
        id: VAULT_METADATA_ID,
        data: updatedEncryptedMetadata
      });
      
      isVaultLocked = false;
      
      // Set auto-lock timer if timeout > 0
      if (autoLockTimeout > 0) {
        if (vaultTimeout) {
          clearTimeout(vaultTimeout);
        }
        vaultTimeout = setTimeout(() => {
          lockVault();
        }, autoLockTimeout * 60 * 1000);
      }
      
      return true;
    } catch (error) {
      // Decryption failed - wrong password
      return false;
    }
  } catch (error) {
    console.error('Error unlocking vault:', error);
    return false;
  }
}

/**
 * Locks the vault
 * @returns {Promise<void>}
 */
export function lockVault() {
  masterKey = null;
  isVaultLocked = true;
  
  if (vaultTimeout) {
    clearTimeout(vaultTimeout);
    vaultTimeout = null;
  }
}

/**
 * Checks if the vault is currently locked
 * @returns {boolean} Whether the vault is locked
 */
export function isLocked() {
  return isVaultLocked;
}

/**
 * Adds a credential to the vault
 * @param {Object} credential - The credential to add
 * @returns {Promise<string>} The ID of the saved credential
 */
export async function addCredential(credential) {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    // Generate an ID if not provided
    if (!credential.id) {
      credential.id = 'cred-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
    
    // Add metadata
    credential.createdAt = new Date().toISOString();
    credential.updatedAt = new Date().toISOString();
    
    // Encrypt the credential
    const encryptedData = await encryptData(masterKey, JSON.stringify(credential));
    
    // Save to vault
    await saveToVault({
      id: credential.id,
      url: credential.url, // Store unencrypted for search
      username: credential.username, // Store unencrypted for search
      data: encryptedData
    });
    
    return credential.id;
  } catch (error) {
    console.error('Error adding credential:', error);
    throw error;
  }
}

/**
 * Updates an existing credential
 * @param {string} id - The ID of the credential to update
 * @param {Object} updatedData - The updated credential data
 * @returns {Promise<boolean>} Whether the update was successful
 */
export async function updateCredential(id, updatedData) {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    // Get the existing credential
    const existingItem = await getFromVault(id);
    if (!existingItem) {
      return false;
    }
    
    // Decrypt existing data
    const decryptedString = await decryptData(
      masterKey,
      existingItem.data.iv,
      existingItem.data.ciphertext
    );
    const credential = JSON.parse(decryptedString);
    
    // Update with new data
    const updatedCredential = {
      ...credential,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    // Encrypt the updated credential
    const encryptedData = await encryptData(masterKey, JSON.stringify(updatedCredential));
    
    // Save to vault
    await saveToVault({
      id: id,
      url: updatedCredential.url, // Store unencrypted for search
      username: updatedCredential.username, // Store unencrypted for search
      data: encryptedData
    });
    
    return true;
  } catch (error) {
    console.error('Error updating credential:', error);
    throw error;
  }
}

/**
 * Gets a credential from the vault
 * @param {string} id - The ID of the credential to get
 * @returns {Promise<Object>} The decrypted credential
 */
export async function getCredential(id) {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    const item = await getFromVault(id);
    if (!item) {
      return null;
    }
    
    // Decrypt the credential
    const decryptedString = await decryptData(
      masterKey,
      item.data.iv,
      item.data.ciphertext
    );
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error getting credential:', error);
    throw error;
  }
}

/**
 * Gets all credentials from the vault
 * @returns {Promise<Array<Object>>} Array of decrypted credentials
 */
export async function getAllCredentials() {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    const items = await getAllFromVault();
    const credentials = [];
    
    for (const item of items) {
      // Skip the metadata entry
      if (item.id === VAULT_METADATA_ID) {
        continue;
      }
      
      try {
        // Decrypt the credential
        const decryptedString = await decryptData(
          masterKey,
          item.data.iv,
          item.data.ciphertext
        );
        
        credentials.push(JSON.parse(decryptedString));
      } catch (error) {
        console.error(`Error decrypting credential ${item.id}:`, error);
      }
    }
    
    return credentials;
  } catch (error) {
    console.error('Error getting all credentials:', error);
    throw error;
  }
}

/**
 * Deletes a credential from the vault
 * @param {string} id - The ID of the credential to delete
 * @returns {Promise<boolean>} Whether deletion was successful
 */
export async function deleteCredential(id) {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    await removeFromVault(id);
    return true;
  } catch (error) {
    console.error('Error deleting credential:', error);
    return false;
  }
}

/**
 * Searches for credentials by URL
 * @param {string} url - The URL to search for
 * @returns {Promise<Array<Object>>} Array of matching decrypted credentials
 */
export async function findCredentialsByUrl(url) {
  if (isVaultLocked || !masterKey) {
    throw new Error('Vault is locked');
  }
  
  try {
    const allCredentials = await getAllCredentials();
    return allCredentials.filter(cred => 
      cred.url && 
      (cred.url === url || 
      url.includes(cred.url) || 
      cred.url.includes(url))
    );
  } catch (error) {
    console.error('Error searching credentials by URL:', error);
    throw error;
  }
}

/**
 * Changes the master password
 * @param {string} currentPassword - The current master password
 * @param {string} newPassword - The new master password
 * @returns {Promise<boolean>} Whether the change was successful
 */
export async function changeMasterPassword(currentPassword, newPassword) {
  try {
    // First unlock with current password to verify
    const unlocked = await unlockVault(currentPassword);
    if (!unlocked) {
      return false;
    }
    
    // Get all credentials
    const credentials = await getAllCredentials();
    
    // Generate a new salt
    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Derive a new key
    const newKey = await deriveKey(newPassword, newSalt);
    
    // Re-encrypt all credentials with the new key
    for (const credential of credentials) {
      const encryptedData = await encryptData(newKey, JSON.stringify(credential));
      await saveToVault({
        id: credential.id,
        url: credential.url,
        username: credential.username,
        data: encryptedData
      });
    }
    
    // Update metadata
    const metadata = {
      id: VAULT_METADATA_ID,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1
    };
    
    // Encrypt and save the metadata
    const encryptedMetadata = await encryptData(newKey, JSON.stringify(metadata));
    await saveToVault({
      id: VAULT_METADATA_ID,
      data: encryptedMetadata
    });
    
    // Save the new salt
    await saveSettings({
      id: SALT_SETTING_ID,
      salt: Array.from(newSalt)
    });
    
    // Update the in-memory key
    masterKey = newKey;
    
    return true;
  } catch (error) {
    console.error('Error changing master password:', error);
    return false;
  }
}
