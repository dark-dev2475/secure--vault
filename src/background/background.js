// Background script for vault state management
import { 
  initializeVault,
  isVaultInitialized,
  unlockVault,
  lockVault,
  isLocked,
  addCredential,
  getCredential,
  getAllCredentials,
  deleteCredential,
  findCredentialsByUrl
} from '../vault/vault.js';

import { getSettings } from '../storage/storage.js';

// Constants
const SETTINGS_ID = 'user-settings';
const AUTO_LOCK_ALARM = 'auto-lock-alarm';

// State
let settings = null;

// Initialize
async function initialize() {
  try {
    // Load settings
    settings = await getSettings(SETTINGS_ID);
    
    // Set up auto-lock if enabled
    if (settings && settings.autoLockEnabled) {
      setupAutoLock();
    }
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Set up alarm listener
    chrome.alarms.onAlarm.addListener(handleAlarm);
    
    // Set up tab update listener to inject content script
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    
    console.log('Background script initialized');
  } catch (error) {
    console.error('Background initialization error:', error);
  }
}

// Handle messages
function handleMessage(message, sender, sendResponse) {
  // Messages related to credentials
  if (message.action === 'getCredentialsForUrl') {
    handleGetCredentialsForUrl(message, sender, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'saveNewCredential') {
    handleSaveNewCredential(message, sender, sendResponse);
    return true;
  }
  
  // Messages related to vault management
  if (message.action === 'isVaultInitialized') {
    isVaultInitialized().then(initialized => {
      sendResponse({ initialized });
    });
    return true;
  }
  
  if (message.action === 'initializeVault') {
    initializeVault(message.password).then(success => {
      sendResponse({ success });
    });
    return true;
  }
  
  if (message.action === 'unlockVault') {
    unlockVault(message.password, settings?.autoLockTime || 5).then(success => {
      sendResponse({ success });
    });
    return true;
  }
  
  if (message.action === 'lockVault') {
    lockVault();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'isVaultLocked') {
    sendResponse({ locked: isLocked() });
    return true;
  }
}

// Handle getting credentials for a URL
async function handleGetCredentialsForUrl(message, sender, sendResponse) {
  try {
    // If vault is locked, return empty array
    if (isLocked()) {
      sendResponse({ credentials: [] });
      return;
    }
    
    // Find credentials for the URL
    const credentials = await findCredentialsByUrl(message.url);
    sendResponse({ credentials });
  } catch (error) {
    console.error('Error getting credentials for URL:', error);
    sendResponse({ credentials: [], error: error.message });
  }
}

// Handle saving a new credential
async function handleSaveNewCredential(message, sender, sendResponse) {
  try {
    // If vault is locked, prompt user to unlock
    if (isLocked()) {
      // Notify popup to prompt for unlock
      chrome.runtime.sendMessage({ 
        action: 'promptUnlock',
        pendingCredential: message.credential
      });
      
      sendResponse({ success: false, error: 'Vault is locked' });
      return;
    }
    
    // Create notification to ask user if they want to save
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icon.png',
      title: 'Save Password?',
      message: `Do you want to save the password for ${message.credential.username} on ${new URL(message.credential.url).hostname}?`,
      buttons: [
        { title: 'Save' },
        { title: 'Never for this site' }
      ],
      requireInteraction: true
    }, notificationId => {
      // Store the credential temporarily
      chrome.storage.session.set({
        [`pending_credential_${notificationId}`]: message.credential
      });
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving new credential:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle notification interaction
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  try {
    // Get the pending credential
    const data = await chrome.storage.session.get(`pending_credential_${notificationId}`);
    const credential = data[`pending_credential_${notificationId}`];
    
    if (!credential) {
      return;
    }
    
    if (buttonIndex === 0) { // Save
      // Add credential to vault
      await addCredential({
        url: credential.url,
        name: new URL(credential.url).hostname,
        username: credential.username,
        password: credential.password,
        notes: ''
      });
      
      // Notify content script that credentials were updated
      const tabs = await chrome.tabs.query({ url: credential.url + '*' });
      
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'credentialsUpdated',
          credentials: await findCredentialsByUrl(credential.url)
        });
      }
    } else if (buttonIndex === 1) { // Never for this site
      // Store site in never-save list
      const neverSaveList = await chrome.storage.local.get('neverSaveList') || { neverSaveList: [] };
      neverSaveList.neverSaveList.push(new URL(credential.url).hostname);
      await chrome.storage.local.set(neverSaveList);
    }
    
    // Remove the pending credential
    await chrome.storage.session.remove(`pending_credential_${notificationId}`);
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
});

// Set up auto-lock
function setupAutoLock() {
  // Clear any existing alarm
  chrome.alarms.clear(AUTO_LOCK_ALARM);
  
  // Create a new alarm
  if (settings && settings.autoLockEnabled && settings.autoLockTime > 0) {
    chrome.alarms.create(AUTO_LOCK_ALARM, {
      delayInMinutes: settings.autoLockTime,
      periodInMinutes: settings.autoLockTime
    });
  }
}

// Handle alarms
function handleAlarm(alarm) {
  if (alarm.name === AUTO_LOCK_ALARM) {
    // Auto-lock the vault
    lockVault();
    
    // Notify any open popups
    chrome.runtime.sendMessage({ action: 'vaultLocked' });
  }
}

// Handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
  // Only proceed if URL is updated and status is complete
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip chrome:// and edge:// URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('moz-extension://')) {
      return;
    }
    
    // Check if vault is unlocked and we have credentials for this URL
    if (!isLocked()) {
      findCredentialsByUrl(tab.url).then(credentials => {
        if (credentials && credentials.length > 0) {
          // Send credentials to content script
          chrome.tabs.sendMessage(tabId, {
            action: 'credentialsUpdated',
            credentials: credentials
          }).catch(() => {
            // Content script not ready or not injected
            // This is fine, it will request credentials when it loads
          });
        }
      }).catch(error => {
        console.error('Error finding credentials for tab:', error);
      });
    }
  }
}

// Initialize when the extension is loaded
initialize();
