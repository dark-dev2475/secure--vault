// Secure Shelf - Background Service Worker

// Setup auto-locking functionality
let lockTimeoutId = null;
const DEFAULT_LOCK_MINUTES = 5;

// Initialize context menus
function setupContextMenus() {
  chrome.contextMenus.create({
    id: 'fillCredential',
    title: 'Fill with Secure Shelf',
    contexts: ['editable']
  });

  chrome.contextMenus.create({
    id: 'generatePassword',
    title: 'Generate Password',
    contexts: ['editable']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'fillCredential') {
    chrome.tabs.sendMessage(tab.id, { action: 'requestFillCredential' });
  } else if (info.menuItemId === 'generatePassword') {
    chrome.tabs.sendMessage(tab.id, { action: 'requestGeneratePassword' });
  }
});

// Handle messages from popup, content scripts, etc.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔧 Worker received message:', message.action, message);
  console.log('🔧 Full message object:', JSON.stringify(message, null, 2));
  
  switch (message.action) {
    case 'unlockVault':
      // Reset the auto-lock timer
      const lockMinutes = message.lockAfterMinutes || DEFAULT_LOCK_MINUTES;
      console.log(`🔧 Worker: Setting auto-lock for ${lockMinutes} minutes`);
      console.log('🔧 lockAfterMinutes from message:', message.lockAfterMinutes);
      resetLockTimer(lockMinutes);
      sendResponse({ success: true });
      break;
      
    case 'lockVault':
      // Clear the lock timer
      clearLockTimer();
      sendResponse({ success: true });
      break;
      
    case 'resetAutoLockTimer':
      // Reset the timer when user is active
      if (lockTimeoutId && message.lockAfterMinutes) {
        console.log('Worker: Resetting auto-lock timer due to activity');
        resetLockTimer(message.lockAfterMinutes);
      }
      sendResponse({ success: true });
      break;
      
    case 'getActiveTab':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          sendResponse({ url: tabs[0].url, tabId: tabs[0].id });
        } else {
          sendResponse({ url: null, tabId: null });
        }
      });
      return true; // Async response
      
    case 'testAutoLock':
      // Test function to verify auto-lock timing
      console.log('Testing auto-lock with 1 minute timeout');
      resetLockTimer(1); // Set 1 minute for testing
      sendResponse({ success: true, message: 'Auto-lock test started for 1 minute' });
      break;
      
    default:
      sendResponse({ success: true, message: 'Message received' });
  }
  
  return true; // Indicate async response
});

// Timer function to auto-lock vault
function resetLockTimer(minutes) {
  console.log(`🔧 resetLockTimer called with ${minutes} minutes`);
  console.log('🔧 Current lockTimeoutId:', lockTimeoutId);
  
  // Clear any existing timeout
  if (lockTimeoutId) {
    console.log('🔧 Clearing existing timer');
    clearTimeout(lockTimeoutId);
    lockTimeoutId = null;
  }
  
  // Don't set a new timer if minutes is 0 (auto-lock disabled)
  if (minutes <= 0) {
    console.log('🔧 Auto-lock disabled (minutes <= 0)');
    return;
  }
  
  // Set new timeout - ensure minutes is a positive number
  const lockMinutes = Math.max(1, parseInt(minutes) || DEFAULT_LOCK_MINUTES);
  const milliseconds = lockMinutes * 60 * 1000;
  console.log(`🔧 Setting auto-lock timer for ${lockMinutes} minutes (${milliseconds}ms)`);
  console.log(`🔧 Timer will trigger at: ${new Date(Date.now() + milliseconds).toLocaleTimeString()}`);
  console.log(`🔧 Current time: ${new Date().toLocaleTimeString()}`);
  
  // Use setTimeout directly
  lockTimeoutId = setTimeout(() => {
    console.log('🔧 ⏰ Auto-lock timer triggered at:', new Date().toLocaleTimeString());
    console.log('🔧 ⏰ Locking vault now!');
    // Send lock message to any open popups
    chrome.runtime.sendMessage({ action: 'autoLockVault' });
    
    // Update icon to locked state
    chrome.action.setIcon({ path: { '128': 'icons/icon128-locked.svg' } });
    
    lockTimeoutId = null;
  }, milliseconds);
  
  console.log(`🔧 Timer set successfully. New lockTimeoutId:`, lockTimeoutId);
  
  // Update icon to unlocked state
  chrome.action.setIcon({ path: { '128': 'icons/icon128.svg' } });
}

function clearLockTimer() {
  if (lockTimeoutId) {
    clearTimeout(lockTimeoutId);
    lockTimeoutId = null;
  }
  
  // Update icon to locked state
  chrome.action.setIcon({ path: { '128': 'icons/icon128-locked.svg' } });
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});
