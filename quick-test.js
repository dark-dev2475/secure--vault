// Quick Auto-Lock Test Script
// Paste this into the browser console on any page to test the auto-lock timer

console.log('🔧 Starting Auto-Lock Timer Test...');

// Test 1: Send unlock message directly to background
function testDirectUnlock(minutes = 1) {
    console.log(`🔧 Testing direct unlock with ${minutes} minutes...`);
    
    chrome.runtime.sendMessage({
        action: 'unlockVault',
        lockAfterMinutes: minutes
    }, (response) => {
        console.log('🔧 Direct unlock response:', response);
    });
}

// Test 2: Check if background script is responding
function testBackgroundPing() {
    console.log('🔧 Testing background script communication...');
    
    chrome.runtime.sendMessage({
        action: 'ping'
    }, (response) => {
        console.log('🔧 Background ping response:', response);
    });
}

// Test 3: Send test auto-lock command
function testAutoLockCommand() {
    console.log('🔧 Testing auto-lock command...');
    
    chrome.runtime.sendMessage({
        action: 'testAutoLock'
    }, (response) => {
        console.log('🔧 Test auto-lock response:', response);
    });
}

// Run all tests
console.log('🔧 Available test functions:');
console.log('testDirectUnlock(1) - Test unlock with 1 minute timer');
console.log('testBackgroundPing() - Test background communication');
console.log('testAutoLockCommand() - Test auto-lock command');
console.log('');
console.log('🔧 Running initial tests...');

testBackgroundPing();
setTimeout(() => testAutoLockCommand(), 1000);
setTimeout(() => testDirectUnlock(1), 2000);

console.log('🔧 Tests initiated. Check Service Worker console for detailed logs!');
console.log('🔧 Go to: Chrome Extensions → Secure Shelf → Service Worker → Console');
