/**
 * Secure Shelf Debug Console Commands
 * 
 * Open the browser console on any page and run these commands to test the extension:
 */

// Test auto-lock timer with 1 minute timeout
function testAutoLock() {
    chrome.runtime.sendMessage({ action: 'testAutoLock' }, (response) => {
        console.log('Auto-lock test response:', response);
    });
}

// Check current auto-lock timer status
function checkTimerStatus() {
    console.log('Checking auto-lock timer status...');
    console.log('Look for timer logs in the service worker console (Extension tab in DevTools)');
}

// Simulate unlocking vault with custom timeout
function testUnlockWithTimeout(minutes) {
    chrome.runtime.sendMessage({ 
        action: 'unlockVault', 
        lockAfterMinutes: minutes 
    }, (response) => {
        console.log(`Unlock test with ${minutes} minutes:`, response);
    });
}

// Test activity reset
function testActivityReset(minutes = 5) {
    chrome.runtime.sendMessage({ 
        action: 'resetAutoLockTimer', 
        lockAfterMinutes: minutes 
    }, (response) => {
        console.log('Activity reset test:', response);
    });
}

// Instructions
console.log('🔐 Secure Shelf Debug Commands Available:');
console.log('');
console.log('testAutoLock() - Test auto-lock with 1 minute timeout');
console.log('testUnlockWithTimeout(minutes) - Test unlock with custom timeout');
console.log('testActivityReset(minutes) - Test activity timer reset');
console.log('checkTimerStatus() - Check timer status');
console.log('');
console.log('Usage examples:');
console.log('testAutoLock()');
console.log('testUnlockWithTimeout(2) // 2 minute timeout');
console.log('testActivityReset(5) // Reset 5 minute timer');
console.log('');
console.log('⚠️  Make sure to check the Service Worker console for detailed logs!');
console.log('   Go to Chrome Extensions → Secure Shelf → Service Worker → Console');
