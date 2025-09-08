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
  switch (message.action) {
    case 'unlockVault':
      // Reset the auto-lock timer
      resetLockTimer(message.lockAfterMinutes || DEFAULT_LOCK_MINUTES);
      sendResponse({ success: true });
      break;
      
    case 'lockVault':
      // Clear the lock timer
      clearLockTimer();
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
      
    default:
      sendResponse({ success: true, message: 'Message received' });
  }
  
  return true; // Indicate async response
});

// Timer function to auto-lock vault
function resetLockTimer(minutes) {
  // Clear any existing timeout
  if (lockTimeoutId) {
    clearTimeout(lockTimeoutId);
  }
  
  // Set new timeout
  const milliseconds = minutes * 60 * 1000;
  lockTimeoutId = setTimeout(() => {
    // Send lock message to any open popups
    chrome.runtime.sendMessage({ action: 'autoLockVault' });
    lockTimeoutId = null;
  }, milliseconds);
}

function clearLockTimer() {
  if (lockTimeoutId) {
    clearTimeout(lockTimeoutId);
    lockTimeoutId = null;
  }
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});
