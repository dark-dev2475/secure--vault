// Absolute minimal background script
console.log('Minimal background script loaded.');

// No listeners, no imports, nothing else

// Constants
const SETTINGS_ID = 'user-settings';
const AUTO_LOCK_ALARM = 'auto-lock-alarm';
const INACTIVITY_CHECK_ALARM = 'inactivity-check-alarm';

// State
let settings = null;
let lastActiveTime = Date.now();

// --- Event Listeners (Registered Synchronously at Top Level) ---

// Fired when the extension is first installed, on update, or when Chrome is updated.
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('onInstalled event fired. Reason:', details.reason);
  await initialize();
});

// Fired when a profile that has this extension installed first starts up.
chrome.runtime.onStartup.addListener(async () => {
  console.log('onStartup event fired.');
  await initialize();
});

// Fired when a message is sent from either an extension process or a content script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // This return true is crucial for async sendResponse
  handleMessage(message, sender, sendResponse);
  return true;
});

// Fired when an alarm has elapsed.
chrome.alarms.onAlarm.addListener(handleAlarm);

// Fired when a tab is updated.
chrome.tabs.onUpdated.addListener(handleTabUpdate);

// Fired when the user clicks on the browser action.
chrome.action.onClicked.addListener(handleBrowserActionClick);

// Fired when a registered command is executed using a keyboard shortcut.
chrome.commands.onCommand.addListener(handleCommand);

// Fired when a context menu item is clicked.
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);


// --- Initialization Function ---

async function initialize() {
  console.log('Initializing background script...');
  try {
    // Load settings
    const loadedSettings = await getSettings(SETTINGS_ID);
    
    if (!loadedSettings) {
      console.log('No settings found, creating defaults.');
      settings = {
        id: SETTINGS_ID,
        autoLockEnabled: true,
        autoLockTime: 5, // minutes
        keyStretchingIterations: 100000,
        theme: 'light',
        fontSize: 14,
        autofillEnabled: true,
        autofillIconEnabled: true,
        autofillConfirmation: true
      };
      await saveSettings(settings);
    } else {
      settings = loadedSettings;
    }
    
    console.log('Settings initialized:', settings);
    
    // Set up alarms and context menus that depend on settings
    setupAutoLock();
    startInactivityTracking();
    setupContextMenu();
    
    console.log('Background script initialized successfully.');
  } catch (error) {
    console.error('Background initialization error:', error);
  }
}


// --- Message Handling ---

async function handleMessage(message, sender, sendResponse) {
  updateLastActivityTime();

  // Ensure settings are loaded before processing messages that might need them.
  if (!settings) {
    await initialize();
  }

  const actions = {
    'isVaultInitialized': () => isVaultInitialized(),
    'initializeVault': (msg) => initializeVault(msg.masterPassword),
    'unlockVault': async (msg) => {
      await unlockVault(msg.masterPassword);
      updateBrowserActionIcon();
      return null; // No specific return value needed
    },
    'lockVault': async () => {
      await lockVault();
      updateBrowserActionIcon();
      return null;
    },
    'isLocked': () => isLocked(),
    'getAllCredentials': () => getAllCredentials(),
    'addCredential': (msg) => addCredential(msg.credential),
    'getCredential': (msg) => getCredential(msg.id),
    'deleteCredential': (msg) => deleteCredential(msg.id),
    'changeMasterPassword': (msg) => changeMasterPassword(msg.oldPassword, msg.newPassword),
    'getCredentialsForUrl': (msg) => findCredentialsByUrl(msg.url),
    'getSettings': () => Promise.resolve(settings),
    'saveSettings': async (msg) => {
      settings = { ...settings, ...msg.settings };
      await saveSettings(settings);
      setupAutoLock(); // Re-apply settings-dependent features
      return settings;
    },
    'openPasswordGenerator': () => {
      chrome.windows.create({
        url: 'generator.html',
        type: 'popup',
        width: 500,
        height: 700
      });
    },
    'passwordGenerated': (msg) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'fillPassword', password: msg.password });
        }
      });
    },
    'updateLastActivity': () => Promise.resolve({ success: true })
  };

  if (actions[message.action]) {
    try {
      const result = await actions[message.action](message);
      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error(`Error handling action "${message.action}":`, error);
      sendResponse({ success: false, error: error.message });
    }
  } else {
    console.warn('Unknown message action:', message.action);
    sendResponse({ success: false, error: 'Unknown action' });
  }
}


// --- Alarm, Inactivity, and UI Functions ---

function setupAutoLock() {
  chrome.alarms.clear(AUTO_LOCK_ALARM);
  if (settings && settings.autoLockEnabled && settings.autoLockTime > 0) {
    chrome.alarms.create(AUTO_LOCK_ALARM, { delayInMinutes: settings.autoLockTime });
    console.log(`Auto-lock alarm set for ${settings.autoLockTime} minutes.`);
  }
}

function startInactivityTracking() {
  chrome.alarms.create(INACTIVITY_CHECK_ALARM, { periodInMinutes: 1 });
}

function updateLastActivityTime() {
  lastActiveTime = Date.now();
  if (settings && settings.autoLockEnabled) {
    setupAutoLock(); // Reset the alarm on activity
  }
}

async function handleAlarm(alarm) {
  if (alarm.name === AUTO_LOCK_ALARM || alarm.name === INACTIVITY_CHECK_ALARM) {
    const idleMinutes = (Date.now() - lastActiveTime) / (1000 * 60);
    if (settings && settings.autoLockEnabled && idleMinutes >= settings.autoLockTime) {
      const locked = await isLocked();
      if (!locked) {
        console.log(`Locking vault due to inactivity of ${Math.floor(idleMinutes)} minutes.`);
        await lockVault();
        updateBrowserActionIcon();
      }
    }
  }
}

async function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (error) {
      if (!error.message.includes('Cannot access a chrome:// URL') && 
          !error.message.includes('The extensions gallery cannot be scripted')) {
        console.warn(`Could not inject content script into ${tab.url}:`, error);
      }
    }
  }
}

function handleBrowserActionClick(tab) {
  // Default behavior is to open popup.html, which is what we want.
  console.log('Browser action clicked.');
}

function setupContextMenu() {
  chrome.contextMenus.create({
    id: 'generate-password-context',
    title: 'Generate Secure Password',
    contexts: ['editable']
  });
}

function handleContextMenuClick(info, tab) {
  if (info.menuItemId === 'generate-password-context') {
    handleMessage({ action: 'openPasswordGenerator' }, null, () => {});
  }
}

async function handleCommand(command) {
  if (command === 'toggle-lock') {
    const locked = await isLocked();
    if (locked) {
      chrome.action.openPopup(); // Prompt user to unlock
    } else {
      await lockVault();
      updateBrowserActionIcon();
    }
  }
}

async function updateBrowserActionIcon() {
  // This function is a placeholder as icons have been removed from manifest
  // If you add icons back, this will manage the locked/unlocked state icon
  const manifest = chrome.runtime.getManifest();
  if (!manifest.icons) return;

  const locked = await isLocked();
  const iconPath = locked ? 'assets/icon128-locked.png' : 'assets.icon128.png';
  chrome.action.setIcon({ path: iconPath });
}

console.log('Background script loaded and top-level listeners attached.');
