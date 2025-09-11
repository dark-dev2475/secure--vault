// Clean Secure Shelf - Background Service Worker
console.log('� Service Worker starting fresh...');

// Simple auto-lock state
let autoLockTimer = null;
let vaultState = 'locked'; // 'locked' or 'unlocked'

// Basic message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('� Message received:', message.action);
  console.log('📨 Full message:', JSON.stringify(message, null, 2));
  console.log('📨 Current vault state:', vaultState);
  console.log('📨 Current timer status:', autoLockTimer ? 'ACTIVE' : 'INACTIVE');
  
  switch (message.action) {
    case 'unlockVault':
      console.log('� === VAULT UNLOCK PROCESS ===');
      const minutes = message.minutes || message.lockAfterMinutes || 5;
      console.log(`🔓 Unlocking vault with ${minutes} minute auto-lock`);
      
      vaultState = 'unlocked';
      startAutoLock(minutes);
      
      console.log('🔓 Vault unlock complete');
      sendResponse({ success: true, state: vaultState });
      break;
      
    case 'startAutoLock':
      console.log('⏰ === MANUAL AUTO-LOCK START ===');
      const lockMinutes = message.minutes || 5;
      startAutoLock(lockMinutes);
      sendResponse({ success: true });
      break;
      
    case 'lockVault':
      console.log('� === VAULT LOCK PROCESS ===');
      vaultState = 'locked';
      clearAutoLock();
      console.log('🔒 Vault locked manually');
      sendResponse({ success: true, state: vaultState });
      break;
      
    case 'clearAutoLock':
      console.log('🚫 === CLEAR AUTO-LOCK ===');
      clearAutoLock();
      sendResponse({ success: true });
      break;
      
    case 'getStatus':
      console.log('📊 === STATUS CHECK ===');
      const status = {
        vaultState: vaultState,
        timerActive: !!autoLockTimer,
        timerId: autoLockTimer
      };
      console.log('📊 Current status:', status);
      sendResponse(status);
      break;
      
    default:
      console.log('❓ Unknown action:', message.action);
      sendResponse({ success: true });
  }
  
  return true;
});

function startAutoLock(minutes) {
  console.log(`⏰ === STARTING AUTO-LOCK TIMER ===`);
  console.log(`⏰ Duration: ${minutes} minutes`);
  
  // Clear existing timer
  if (autoLockTimer) {
    console.log('⏰ Clearing existing timer with ID:', autoLockTimer);
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  
  // Calculate milliseconds
  const milliseconds = minutes * 60 * 1000;
  console.log(`⏰ Timer duration: ${milliseconds}ms`);
  
  // Log timing details
  const now = new Date();
  const triggerTime = new Date(now.getTime() + milliseconds);
  console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
  console.log(`⏰ Will trigger at: ${triggerTime.toLocaleTimeString()}`);
  console.log(`⏰ That's ${Math.round(milliseconds/1000)} seconds from now`);
  
  // Set the timer
  autoLockTimer = setTimeout(() => {
    console.log('� === AUTO-LOCK TRIGGERED ===');
    console.log('� Trigger time:', new Date().toLocaleTimeString());
    console.log('🔒 Previous vault state:', vaultState);
    
    // Lock the vault
    vaultState = 'locked';
    autoLockTimer = null;
    
    console.log('🔒 New vault state:', vaultState);
    console.log('🔒 Timer cleared');
    
    // Notify popup if it exists
    try {
      chrome.runtime.sendMessage({ action: 'autoLockVault' }, (response) => {
        console.log('🔒 Popup notification response:', response);
      });
    } catch (e) {
      console.log('� No popup to notify (normal)');
    }
    
    console.log('� === AUTO-LOCK COMPLETE ===');
  }, milliseconds);
  
  console.log(`⏰ Timer set successfully with ID: ${autoLockTimer}`);
  console.log(`⏰ === AUTO-LOCK TIMER ACTIVE ===`);
}

function clearAutoLock() {
  console.log('🚫 === CLEARING AUTO-LOCK ===');
  
  if (autoLockTimer) {
    console.log('� Clearing timer with ID:', autoLockTimer);
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
    console.log('🚫 Timer cleared successfully');
  } else {
    console.log('🚫 No timer to clear');
  }
  
  console.log('� === CLEAR COMPLETE ===');
}

console.log('✅ Clean Service Worker ready');
console.log('✅ Initial vault state:', vaultState);
console.log('✅ Initial timer status:', autoLockTimer ? 'ACTIVE' : 'INACTIVE');
