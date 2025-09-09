// Popup UI functionality
import { 
  initializeVault, 
  isVaultInitialized, 
  unlockVault, 
  lockVault, 
  isLocked, 
  addCredential,
  updateCredential,
  getCredential,
  getAllCredentials,
  deleteCredential,
  findCredentialsByUrl
} from '../vault/vault.js';

import { generatePassword } from '../generator/generator.js';
import { getSettings, saveSettings } from '../storage/storage.js';

// DOM Elements
const screens = {
  auth: document.getElementById('auth-screen'),
  dashboard: document.getElementById('dashboard-screen'),
  detail: document.getElementById('detail-screen'),
  form: document.getElementById('credential-form-screen'),
  passwordGenerator: document.getElementById('generate-password-screen')
};

// Auth elements
const loginTab = document.getElementById('login-tab');
const setupTab = document.getElementById('setup-tab');
const loginForm = document.getElementById('login-form');
const setupForm = document.getElementById('setup-form');
const masterPasswordInput = document.getElementById('master-password');
const newMasterPasswordInput = document.getElementById('new-master-password');
const confirmMasterPasswordInput = document.getElementById('confirm-master-password');
const unlockButton = document.getElementById('unlock-button');
const setupButton = document.getElementById('setup-button');
const loginError = document.getElementById('login-error');
const setupError = document.getElementById('setup-error');

// Dashboard elements
const credentialsList = document.getElementById('credentials-list');
const searchInput = document.getElementById('search-input');
const addCredentialButton = document.getElementById('add-credential-button');
const optionsButton = document.getElementById('options-button');
const lockButton = document.getElementById('lock-button');
const emptyState = document.getElementById('empty-state');

// Detail elements
const backToListButton = document.getElementById('back-to-list-button');
const detailUrl = document.getElementById('detail-url');
const usernameValue = document.getElementById('username-value');
const passwordValue = document.getElementById('password-value');
const detailNotes = document.getElementById('detail-notes');
const copyUsernameButton = document.getElementById('copy-username');
const copyPasswordButton = document.getElementById('copy-password');
const showPasswordButton = document.getElementById('show-password');
const editCredentialButton = document.getElementById('edit-credential-button');
const deleteCredentialButton = document.getElementById('delete-credential-button');

// Credential form elements
const formTitle = document.getElementById('form-title');
const cancelFormButton = document.getElementById('cancel-form-button');
const credentialUrlInput = document.getElementById('credential-url');
const credentialNameInput = document.getElementById('credential-name');
const credentialUsernameInput = document.getElementById('credential-username');
const credentialPasswordInput = document.getElementById('credential-password');
const credentialNotesInput = document.getElementById('credential-notes');
const generatePasswordButton = document.getElementById('generate-password');
const togglePasswordButton = document.getElementById('toggle-password');
const saveCredentialButton = document.getElementById('save-credential-button');
const formError = document.getElementById('form-error');

// Password generator elements
const closeGeneratorButton = document.getElementById('close-generator-button');
const passwordLengthInput = document.getElementById('password-length');
const lengthValue = document.getElementById('length-value');
const includeUppercase = document.getElementById('include-uppercase');
const includeLowercase = document.getElementById('include-lowercase');
const includeNumbers = document.getElementById('include-numbers');
const includeSymbols = document.getElementById('include-symbols');
const generatedPasswordInput = document.getElementById('generated-password');
const copyGeneratedButton = document.getElementById('copy-generated');
const regenerateButton = document.getElementById('regenerate-button');
const usePasswordButton = document.getElementById('use-password-button');

// State
let currentCredentials = [];
let currentCredentialId = null;
let editMode = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Set up message listener for background service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Popup received message:', message.action);
      if (message.action === 'autoLockVault') {
        // Auto-lock vault
        console.log('Auto-locking vault from popup');
        lockVault();
        
        // Show appropriate screen
        showScreen('auth');
        displayMessage(loginError, 'Vault has been automatically locked for security.');
      }
      return true;
    });
    
    // Check if vault is initialized
    const initialized = await isVaultInitialized();
    
    if (initialized) {
      // Show login tab
      loginTab.classList.add('active');
      setupTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      setupForm.classList.add('hidden');
    } else {
      // Show setup tab
      loginTab.classList.remove('active');
      setupTab.classList.add('active');
      loginForm.classList.add('hidden');
      setupForm.classList.remove('hidden');
    }

    // Check if currently on website to auto-fill
    getCurrentTab(async (tab) => {
      if (tab && tab.url) {
        credentialUrlInput.value = tab.url;
      }
    });

  } catch (error) {
    console.error('Initialization error:', error);
    showError(loginError, 'Failed to initialize the application.');
  }
});

// Tab switching
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  setupTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  setupForm.classList.add('hidden');
});

setupTab.addEventListener('click', () => {
  loginTab.classList.remove('active');
  setupTab.classList.add('active');
  loginForm.classList.add('hidden');
  setupForm.classList.remove('hidden');
});

// Unlock vault
unlockButton.addEventListener('click', async () => {
  const password = masterPasswordInput.value;
  
  if (!password) {
    showError(loginError, 'Please enter your master password.');
    return;
  }
  
  try {
    const success = await unlockVault(password);
    
    if (success) {
      // Get user auto-lock settings
      let autoLockMinutes = 5; // Default
      try {
        const userSettings = await getSettings('user-settings');
        console.log('🔧 Popup: Retrieved user settings:', userSettings);
        if (userSettings) {
          if (userSettings.autoLockEnabled === false) {
            autoLockMinutes = 0; // Disable auto-lock
          } else if (userSettings.autoLockTime > 0) {
            autoLockMinutes = userSettings.autoLockTime;
          }
        } else {
          // No settings found, use default and create them
          console.log('🔧 Popup: No user settings found, using defaults');
          const defaultSettings = {
            id: 'user-settings',
            autoLockEnabled: true,
            autoLockTime: 5
          };
          // Save default settings
          await saveSettings(defaultSettings);
          console.log('🔧 Popup: Saved default settings');
        }
        console.log(`🔧 Popup: Using auto-lock timeout: ${autoLockMinutes} minutes`);
      } catch (e) {
        console.error('🔧 Error getting user settings for auto-lock:', e);
        // Use default on error
        autoLockMinutes = 5;
      }

      // Inform background to align its state and reset activity timers
      try {
        console.log('🔧 Popup: Sending unlock message to background with lockAfterMinutes:', autoLockMinutes);
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ 
            action: 'unlockVault', 
            masterPassword: password,
            lockAfterMinutes: autoLockMinutes
          }, (resp) => {
            console.log('🔧 Popup: Background response:', resp);
            if (chrome.runtime.lastError) {
              console.log('🔧 Popup: Runtime error:', chrome.runtime.lastError);
              return resolve(); // Non-fatal
            }
            resolve();
          });
        });
      } catch (_e) {
        console.error('🔧 Popup: Error sending message to background:', _e);
        // Ignore background sync issues; local unlock is sufficient for UI
      }
      masterPasswordInput.value = '';
      loginError.classList.add('hidden');
      await loadDashboard();
    } else {
      showError(loginError, 'Incorrect master password.');
    }
  } catch (error) {
    console.error('Unlock error:', error);
    showError(loginError, 'Failed to unlock the vault.');
  }
});

// Setup vault
setupButton.addEventListener('click', async () => {
  const newPassword = newMasterPasswordInput.value;
  const confirmPassword = confirmMasterPasswordInput.value;
  
  if (!newPassword) {
    showError(setupError, 'Please enter a master password.');
    return;
  }
  
  if (newPassword.length < 8) {
    showError(setupError, 'Master password must be at least 8 characters.');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showError(setupError, 'Passwords do not match.');
    return;
  }
  
  try {
    const success = await initializeVault(newPassword);
    
    if (success) {
      newMasterPasswordInput.value = '';
      confirmMasterPasswordInput.value = '';
      setupError.classList.add('hidden');
      await loadDashboard();
    } else {
      showError(setupError, 'Failed to create the vault.');
    }
  } catch (error) {
    console.error('Setup error:', error);
    showError(setupError, 'Failed to create the vault.');
  }
});

// Load dashboard
async function loadDashboard() {
  try {
    // Switch to dashboard screen
    showScreen(screens.dashboard);
    
    // Load credentials
    await loadCredentials();
    
  } catch (error) {
    console.error('Dashboard loading error:', error);
  }
}

// Load credentials
async function loadCredentials() {
  try {
    currentCredentials = await getAllCredentials();
    
    // Clear the list
    while (credentialsList.firstChild) {
      credentialsList.removeChild(credentialsList.firstChild);
    }
    
    // Show empty state if no credentials
    if (currentCredentials.length === 0) {
      credentialsList.appendChild(emptyState);
      return;
    }
    
    // Hide empty state
    emptyState.remove();
    
    // Populate the list
    currentCredentials.forEach(credential => {
      const item = document.createElement('div');
      item.className = 'credential-item';
      item.dataset.id = credential.id;
      
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = credential.name || credential.url;
      
      const username = document.createElement('div');
      username.className = 'username';
      username.textContent = credential.username || '';
      
      item.appendChild(title);
      item.appendChild(username);
      
      item.addEventListener('click', () => {
        viewCredentialDetails(credential.id);
      });
      
      credentialsList.appendChild(item);
    });
    
  } catch (error) {
    console.error('Credentials loading error:', error);
  }
}

// Search credentials
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  
  const items = credentialsList.querySelectorAll('.credential-item');
  items.forEach(item => {
    const title = item.querySelector('.title').textContent.toLowerCase();
    const username = item.querySelector('.username').textContent.toLowerCase();
    
    if (title.includes(query) || username.includes(query)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
});

// View credential details
async function viewCredentialDetails(id) {
  try {
    currentCredentialId = id;
    const credential = await getCredential(id);
    
    if (!credential) {
      return;
    }
    
    // Populate detail view
    detailUrl.textContent = credential.url || '';
    usernameValue.textContent = credential.username || '';
    passwordValue.textContent = '••••••••';
    passwordValue.dataset.password = credential.password || '';
    detailNotes.textContent = credential.notes || '';
    
    // Switch to detail screen
    showScreen(screens.detail);
    
  } catch (error) {
    console.error('Detail view error:', error);
  }
}

// Show/hide password
showPasswordButton.addEventListener('click', () => {
  if (passwordValue.textContent === '••••••••') {
    passwordValue.textContent = passwordValue.dataset.password;
    showPasswordButton.textContent = 'Hide';
  } else {
    passwordValue.textContent = '••••••••';
    showPasswordButton.textContent = 'Show';
  }
});

// Copy username
copyUsernameButton.addEventListener('click', () => {
  copyToClipboard(usernameValue.textContent);
  copyUsernameButton.textContent = 'Copied!';
  setTimeout(() => {
    copyUsernameButton.textContent = 'Copy';
  }, 1500);
});

// Copy password
copyPasswordButton.addEventListener('click', () => {
  copyToClipboard(passwordValue.dataset.password);
  copyPasswordButton.textContent = 'Copied!';
  setTimeout(() => {
    copyPasswordButton.textContent = 'Copy';
  }, 1500);
});

// Edit credential
editCredentialButton.addEventListener('click', () => {
  editMode = true;
  formTitle.textContent = 'Edit Credential';
  
  // Populate form
  credentialUrlInput.value = detailUrl.textContent;
  credentialNameInput.value = currentCredentials.find(c => c.id === currentCredentialId)?.name || '';
  credentialUsernameInput.value = usernameValue.textContent;
  credentialPasswordInput.value = passwordValue.dataset.password;
  credentialNotesInput.value = detailNotes.textContent;
  
  // Switch to form screen
  showScreen(screens.form);
});

// Delete credential
deleteCredentialButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete this credential?')) {
    try {
      await deleteCredential(currentCredentialId);
      backToListButton.click();
      await loadCredentials();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
});

// Back to list
backToListButton.addEventListener('click', () => {
  showScreen(screens.dashboard);
});

// Add credential
addCredentialButton.addEventListener('click', () => {
  editMode = false;
  formTitle.textContent = 'Add Credential';
  
  // Clear form
  credentialUrlInput.value = '';
  credentialNameInput.value = '';
  credentialUsernameInput.value = '';
  credentialPasswordInput.value = '';
  credentialNotesInput.value = '';
  
  // Get current URL if in a tab
  getCurrentTab(tab => {
    if (tab && tab.url) {
      credentialUrlInput.value = tab.url;
    }
  });
  
  // Switch to form screen
  showScreen(screens.form);
});

// Cancel form
cancelFormButton.addEventListener('click', () => {
  if (editMode) {
    showScreen(screens.detail);
  } else {
    showScreen(screens.dashboard);
  }
});

// Save credential
saveCredentialButton.addEventListener('click', async () => {
  try {
    const url = credentialUrlInput.value;
    const name = credentialNameInput.value;
    const username = credentialUsernameInput.value;
    const password = credentialPasswordInput.value;
    const notes = credentialNotesInput.value;
    
    if (!url) {
      showError(formError, 'Please enter a URL.');
      return;
    }
    
    if (!password) {
      showError(formError, 'Please enter a password.');
      return;
    }
    
    const credential = {
      url,
      name,
      username,
      password,
      notes
    };
    
    if (editMode) {
      // Update existing credential
      await updateCredential(currentCredentialId, credential);
    } else {
      // Add new credential
      await addCredential(credential);
    }
    
    // Go back to dashboard
    showScreen(screens.dashboard);
    
    // Reload credentials
    await loadCredentials();
    
  } catch (error) {
    console.error('Save error:', error);
    showError(formError, 'Failed to save credential.');
  }
});

// Generate password button
generatePasswordButton.addEventListener('click', () => {
  showScreen(screens.passwordGenerator);
  generateNewPassword();
});

// Password toggle
togglePasswordButton.addEventListener('click', () => {
  if (credentialPasswordInput.type === 'password') {
    credentialPasswordInput.type = 'text';
    togglePasswordButton.textContent = '🔒';
  } else {
    credentialPasswordInput.type = 'password';
    togglePasswordButton.textContent = '👁️';
  }
});

// Lock vault
lockButton.addEventListener('click', () => {
  lockVault();
  showScreen(screens.auth);
});

// Options button
optionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Generate new password
function generateNewPassword() {
  const options = {
    length: parseInt(passwordLengthInput.value),
    uppercase: includeUppercase.checked,
    lowercase: includeLowercase.checked,
    numbers: includeNumbers.checked,
    symbols: includeSymbols.checked
  };
  
  const password = generatePassword(options);
  generatedPasswordInput.value = password;
}

// Password length slider
passwordLengthInput.addEventListener('input', () => {
  lengthValue.textContent = passwordLengthInput.value;
});

// Regenerate password
regenerateButton.addEventListener('click', () => {
  generateNewPassword();
});

// Use generated password
usePasswordButton.addEventListener('click', () => {
  credentialPasswordInput.value = generatedPasswordInput.value;
  showScreen(screens.form);
});

// Close generator
closeGeneratorButton.addEventListener('click', () => {
  showScreen(screens.form);
});

// Copy generated password
copyGeneratedButton.addEventListener('click', () => {
  copyToClipboard(generatedPasswordInput.value);
  copyGeneratedButton.textContent = '✓';
  setTimeout(() => {
    copyGeneratedButton.textContent = '📋';
  }, 1500);
});

// Helper: Show screen
function showScreen(screen) {
  Object.values(screens).forEach(s => {
    s.classList.remove('active');
  });
  screen.classList.add('active');
}

// Helper: Show error
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

// Helper: Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

// Helper: Get current tab
function getCurrentTab(callback) {
  if (chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      callback(tabs[0]);
    });
  } else {
    callback(null);
  }
}
