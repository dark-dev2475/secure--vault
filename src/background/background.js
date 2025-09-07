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
  findCredentialsByUrl,
  changeMasterPassword
} from '../vault/vault.js';

import { getSettings, saveSettings } from '../storage/storage.js';

// Constants
const SETTINGS_ID = 'user-settings';
const AUTO_LOCK_ALARM = 'auto-lock-alarm';
const INACTIVITY_CHECK_ALARM = 'inactivity-check-alarm';
const USER_ACTIVITY_KEY = 'last-user-activity';

// State
let settings = null;
let lastActiveTime = Date.now();

// Initialize
async function initialize() {
  try {
    // Load settings
    settings = await getSettings(SETTINGS_ID);
    
    if (!settings) {
      // Create default settings if none exist
      settings = {
        id: SETTINGS_ID,
        autoLockEnabled: true,
        autoLockTime: 5,
        keyStretchingIterations: 100000,
        theme: 'light',
        fontSize: 14,
        autofillEnabled: true,
        autofillIconEnabled: true,
        autofillConfirmation: true
      };
      
      await saveSettings(settings);
    }
    
    // Set up auto-lock if enabled
    if (settings.autoLockEnabled) {
      setupAutoLock();
    }
    
    // Start inactivity tracking
    startInactivityTracking();
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Set up alarm listener
    chrome.alarms.onAlarm.addListener(handleAlarm);
    
    // Set up tab update listener to inject content script
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    
    // Set up browser action click handler
    chrome.action.onClicked.addListener(handleBrowserActionClick);
    
    // Set up context menu for generating passwords
    setupContextMenu();
    
    // Set up keyboard shortcut listeners
    chrome.commands.onCommand.addListener(handleCommand);
    
    console.log('Background script initialized');
  } catch (error) {
    console.error('Background initialization error:', error);
  }
}

// Handle messages
function handleMessage(message, sender, sendResponse) {
  // Update last activity time
  updateLastActivityTime();
  
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
      if (success) {
        // Update the extension icon to show unlocked state
        updateExtensionIcon(false);
      }
      sendResponse({ success });
    });
    return true;
  }
  
  if (message.action === 'lockVault') {
    lockVault();
    // Update the extension icon to show locked state
    updateExtensionIcon(true);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'isVaultLocked') {
    const locked = isLocked();
    updateExtensionIcon(locked);
    sendResponse({ locked });
    return true;
  }
  
  if (message.action === 'changeMasterPassword') {
    changeMasterPassword(message.currentPassword, message.newPassword).then(success => {
      sendResponse({ success });
    });
    return true;
  }
  
  if (message.action === 'updateSettings') {
    saveSettings(message.settings).then(() => {
      settings = message.settings;
      
      // Update auto-lock settings if needed
      if (settings.autoLockEnabled) {
        setupAutoLock();
      } else {
        chrome.alarms.clear(AUTO_LOCK_ALARM);
      }
      
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error saving settings:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (message.action === 'generatePassword') {
    // This will be handled by the popup script directly
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'fillCredentialById') {
    handleFillCredentialById(message, sender, sendResponse);
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
    
    // Check if this site is in the never-save list
    const hostname = new URL(message.credential.url).hostname;
    const neverSaveData = await chrome.storage.local.get('neverSaveList');
    const neverSaveList = neverSaveData.neverSaveList || [];
    
    if (neverSaveList.includes(hostname)) {
      sendResponse({ success: false, error: 'Site is in never-save list' });
      return;
    }
    
    // Create notification to ask user if they want to save
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icon.png',
      title: 'Save Password?',
      message: `Do you want to save the password for ${message.credential.username} on ${hostname}?`,
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

// Handle filling a credential by ID
async function handleFillCredentialById(message, sender, sendResponse) {
  try {
    // If vault is locked, return error
    if (isLocked()) {
      sendResponse({ success: false, error: 'Vault is locked' });
      return;
    }
    
    // Get the credential
    const credential = await getCredential(message.id);
    
    if (!credential) {
      sendResponse({ success: false, error: 'Credential not found' });
      return;
    }
    
    // Send the credential to the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'fillCredential',
      credential
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error filling credential by ID:', error);
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
        }).catch(() => {
          // Content script might not be ready yet, which is fine
        });
      }
    } else if (buttonIndex === 1) { // Never for this site
      // Store site in never-save list
      const neverSaveData = await chrome.storage.local.get('neverSaveList');
      const neverSaveList = neverSaveData.neverSaveList || [];
      neverSaveList.push(new URL(credential.url).hostname);
      await chrome.storage.local.set({ neverSaveList });
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
    // Only lock if vault is currently unlocked
    if (!isLocked()) {
      // Auto-lock the vault
      lockVault();
      
      // Update the extension icon
      updateExtensionIcon(true);
      
      // Notify any open popups
      chrome.runtime.sendMessage({ action: 'vaultLocked' });
    }
  }
  
  if (alarm.name === INACTIVITY_CHECK_ALARM) {
    checkUserInactivity();
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

// Update the extension icon based on locked state
function updateExtensionIcon(locked) {
  // In a real extension, you would use different icons
  // For now, we'll just change the badge text
  if (locked) {
    chrome.action.setBadgeText({ text: '🔒' });
    chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
  } else {
    chrome.action.setBadgeText({ text: '🔓' });
    chrome.action.setBadgeBackgroundColor({ color: '#2ecc71' });
  }
}

// Handle browser action click
function handleBrowserActionClick(tab) {
  // This will open the popup by default, but we can add additional logic here
  // For example, we could check if there are credentials for the current page
  // and offer to fill them directly
  
  // Update last activity time
  updateLastActivityTime();
}

// Set up context menu
function setupContextMenu() {
  chrome.contextMenus.create({
    id: 'generate-password',
    title: 'Generate Password',
    contexts: ['editable']
  });
  
  chrome.contextMenus.create({
    id: 'fill-credentials',
    title: 'Fill Credentials',
    contexts: ['editable']
  });
  
  // Set up context menu click handler
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'generate-password') {
      // Send message to popup to generate password
      chrome.tabs.sendMessage(tab.id, {
        action: 'showPasswordGenerator',
        target: info.targetElementId
      });
    }
    
    if (info.menuItemId === 'fill-credentials') {
      // Get credentials for current page and show dropdown
      if (!isLocked()) {
        findCredentialsByUrl(tab.url).then(credentials => {
          if (credentials && credentials.length > 0) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showCredentialsMenu',
              credentials,
              target: info.targetElementId
            });
          } else {
            // No credentials found
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNoCredentialsMessage'
            });
          }
        });
      } else {
        // Vault is locked, show message
        chrome.tabs.sendMessage(tab.id, {
          action: 'showVaultLockedMessage'
        });
      }
    }
  });
}

// Handle keyboard commands
function handleCommand(command) {
  if (command === 'toggle-vault-lock') {
    if (isLocked()) {
      // Show popup to unlock
      chrome.action.openPopup();
    } else {
      // Lock the vault
      lockVault();
      updateExtensionIcon(true);
      chrome.runtime.sendMessage({ action: 'vaultLocked' });
    }
  }
  
  if (command === 'fill-credentials') {
    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0) return;
      
      const tab = tabs[0];
      
      if (!isLocked()) {
        const credentials = await findCredentialsByUrl(tab.url);
        
        if (credentials && credentials.length > 0) {
          // If only one credential, fill it directly
          if (credentials.length === 1) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'fillCredential',
              credential: credentials[0]
            });
          } else {
            // Show credential selection
            chrome.tabs.sendMessage(tab.id, {
              action: 'showCredentialsMenu',
              credentials
            });
          }
        }
      } else {
        // Vault is locked, show popup
        chrome.action.openPopup();
      }
    });
  }
  
  // Update last activity time
  updateLastActivityTime();
}

// Start tracking user inactivity
function startInactivityTracking() {
  // Store initial activity time
  updateLastActivityTime();
  
  // Create alarm to check inactivity every minute
  chrome.alarms.create(INACTIVITY_CHECK_ALARM, {
    periodInMinutes: 1
  });
}

// Update last activity time
function updateLastActivityTime() {
  lastActiveTime = Date.now();
  // Store in local storage so it persists even if background script is unloaded
  chrome.storage.local.set({ [USER_ACTIVITY_KEY]: lastActiveTime });
}

// Check user inactivity
async function checkUserInactivity() {
  // Only check if auto-lock is enabled
  if (!settings || !settings.autoLockEnabled) {
    return;
  }
  
  // Check if vault is already locked
  if (isLocked()) {
    return;
  }
  
  try {
    // Get last activity time from storage
    const data = await chrome.storage.local.get(USER_ACTIVITY_KEY);
    const storedLastActiveTime = data[USER_ACTIVITY_KEY] || lastActiveTime;
    
    // Calculate inactivity duration in minutes
    const inactivityDuration = (Date.now() - storedLastActiveTime) / (1000 * 60);
    
    // If inactive for longer than auto-lock time, lock the vault
    if (inactivityDuration >= settings.autoLockTime) {
      lockVault();
      updateExtensionIcon(true);
      chrome.runtime.sendMessage({ action: 'vaultLocked' });
    }
  } catch (error) {
    console.error('Error checking inactivity:', error);
  }
}

// Clear all data (for emergency situations)
async function clearAllData() {
  try {
    // Lock the vault first
    lockVault();
    
    // Clear storage
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    
    // Clear all alarms
    chrome.alarms.clearAll();
    
    // Reset extension icon
    updateExtensionIcon(true);
    
    // Notify any open popups
    chrome.runtime.sendMessage({ action: 'dataCleared' });
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

// Initialize when the extension is loaded
initialize();
