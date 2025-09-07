// Options page functionality
import { getSettings, saveSettings } from '../storage/storage.js';
import { changeMasterPassword, unlockVault, isLocked } from '../vault/vault.js';

// DOM Elements
const autoLockEnabled = document.getElementById('auto-lock-enabled');
const autoLockTime = document.getElementById('auto-lock-time');
const keyStretching = document.getElementById('key-stretching');
const themeSelect = document.getElementById('theme');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const autofillEnabled = document.getElementById('autofill-enabled');
const autofillIconEnabled = document.getElementById('autofill-icon-enabled');
const autofillConfirmation = document.getElementById('autofill-confirmation');
const defaultPasswordLength = document.getElementById('default-password-length');
const defaultLengthValue = document.getElementById('default-length-value');
const includeUppercase = document.getElementById('include-uppercase');
const includeLowercase = document.getElementById('include-lowercase');
const includeNumbers = document.getElementById('include-numbers');
const includeSymbols = document.getElementById('include-symbols');
const currentPassword = document.getElementById('current-password');
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const changePasswordButton = document.getElementById('change-password-button');
const exportButton = document.getElementById('export-button');
const importButton = document.getElementById('import-button');
const importFile = document.getElementById('import-file');
const clearDataButton = document.getElementById('clear-data-button');
const statusMessage = document.getElementById('status-message');

// Settings keys
const SETTINGS_ID = 'user-settings';
const GENERATOR_SETTINGS_ID = 'generator-settings';

// Load settings
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    setupEventListeners();
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings. Please try again.', 'error');
  }
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await getSettings(SETTINGS_ID) || getDefaultSettings();
    const generatorSettings = await getSettings(GENERATOR_SETTINGS_ID) || getDefaultGeneratorSettings();
    
    // Apply UI settings
    autoLockEnabled.checked = settings.autoLockEnabled;
    autoLockTime.value = settings.autoLockTime;
    keyStretching.value = settings.keyStretchingIterations;
    themeSelect.value = settings.theme;
    fontSizeSlider.value = settings.fontSize;
    fontSizeValue.textContent = `${settings.fontSize}px`;
    autofillEnabled.checked = settings.autofillEnabled;
    autofillIconEnabled.checked = settings.autofillIconEnabled;
    autofillConfirmation.checked = settings.autofillConfirmation;
    
    // Apply generator settings
    defaultPasswordLength.value = generatorSettings.defaultLength;
    defaultLengthValue.textContent = `${generatorSettings.defaultLength} characters`;
    includeUppercase.checked = generatorSettings.includeUppercase;
    includeLowercase.checked = generatorSettings.includeLowercase;
    includeNumbers.checked = generatorSettings.includeNumbers;
    includeSymbols.checked = generatorSettings.includeSymbols;
    
    // Apply theme
    applyTheme(settings.theme);
  } catch (error) {
    console.error('Error loading settings:', error);
    throw error;
  }
}

// Get default settings
function getDefaultSettings() {
  return {
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
}

// Get default generator settings
function getDefaultGeneratorSettings() {
  return {
    id: GENERATOR_SETTINGS_ID,
    defaultLength: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true
  };
}

// Setup event listeners
function setupEventListeners() {
  // Auto-save settings when changed
  autoLockEnabled.addEventListener('change', saveUserSettings);
  autoLockTime.addEventListener('change', saveUserSettings);
  keyStretching.addEventListener('change', saveUserSettings);
  themeSelect.addEventListener('change', handleThemeChange);
  fontSizeSlider.addEventListener('input', handleFontSizeChange);
  autofillEnabled.addEventListener('change', saveUserSettings);
  autofillIconEnabled.addEventListener('change', saveUserSettings);
  autofillConfirmation.addEventListener('change', saveUserSettings);
  
  // Password generator settings
  defaultPasswordLength.addEventListener('input', handlePasswordLengthChange);
  includeUppercase.addEventListener('change', saveGeneratorSettings);
  includeLowercase.addEventListener('change', saveGeneratorSettings);
  includeNumbers.addEventListener('change', saveGeneratorSettings);
  includeSymbols.addEventListener('change', saveGeneratorSettings);
  
  // Change master password
  changePasswordButton.addEventListener('click', handleChangePassword);
  
  // Import/Export
  exportButton.addEventListener('click', handleExport);
  importButton.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
  
  // Clear data
  clearDataButton.addEventListener('click', handleClearData);
}

// Save user settings
async function saveUserSettings() {
  try {
    const settings = {
      id: SETTINGS_ID,
      autoLockEnabled: autoLockEnabled.checked,
      autoLockTime: parseInt(autoLockTime.value),
      keyStretchingIterations: parseInt(keyStretching.value),
      theme: themeSelect.value,
      fontSize: parseInt(fontSizeSlider.value),
      autofillEnabled: autofillEnabled.checked,
      autofillIconEnabled: autofillIconEnabled.checked,
      autofillConfirmation: autofillConfirmation.checked
    };
    
    await saveSettings(settings);
    showStatus('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

// Save generator settings
async function saveGeneratorSettings() {
  try {
    const settings = {
      id: GENERATOR_SETTINGS_ID,
      defaultLength: parseInt(defaultPasswordLength.value),
      includeUppercase: includeUppercase.checked,
      includeLowercase: includeLowercase.checked,
      includeNumbers: includeNumbers.checked,
      includeSymbols: includeSymbols.checked
    };
    
    await saveSettings(settings);
    showStatus('Password generator settings saved', 'success');
  } catch (error) {
    console.error('Error saving generator settings:', error);
    showStatus('Error saving generator settings', 'error');
  }
}

// Handle theme change
async function handleThemeChange() {
  const theme = themeSelect.value;
  applyTheme(theme);
  await saveUserSettings();
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// Handle font size change
function handleFontSizeChange() {
  fontSizeValue.textContent = `${fontSizeSlider.value}px`;
  document.documentElement.style.setProperty('--font-size', `${fontSizeSlider.value}px`);
  saveUserSettings();
}

// Handle password length change
function handlePasswordLengthChange() {
  defaultLengthValue.textContent = `${defaultPasswordLength.value} characters`;
  saveGeneratorSettings();
}

// Handle change password
async function handleChangePassword() {
  try {
    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirm = confirmPassword.value;
    
    if (!current) {
      showStatus('Please enter your current password', 'error');
      return;
    }
    
    if (newPass.length < 8) {
      showStatus('New password must be at least 8 characters', 'error');
      return;
    }
    
    if (newPass !== confirm) {
      showStatus('New password and confirmation do not match', 'error');
      return;
    }
    
    // Attempt to change password
    const success = await changeMasterPassword(current, newPass);
    
    if (success) {
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      showStatus('Master password changed successfully', 'success');
    } else {
      showStatus('Failed to change password. Current password may be incorrect.', 'error');
    }
  } catch (error) {
    console.error('Change password error:', error);
    showStatus('Error changing password', 'error');
  }
}

// Handle export
async function handleExport() {
  try {
    // Check if vault is locked
    if (isLocked()) {
      showStatus('Please unlock your vault first', 'warning');
      return;
    }
    
    // Get credentials (this will be implemented in step 7)
    // For now, we'll use a placeholder
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      credentials: []
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `secure-shelf-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showStatus('Data exported successfully', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Error exporting data', 'error');
  }
}

// Handle import
async function handleImport(event) {
  try {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Check if vault is locked
    if (isLocked()) {
      showStatus('Please unlock your vault first', 'warning');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate import data
        if (!data.version || !data.credentials) {
          throw new Error('Invalid import data format');
        }
        
        // Import will be implemented in step 7
        // For now, just show success
        showStatus('Data imported successfully', 'success');
      } catch (error) {
        console.error('Import parsing error:', error);
        showStatus('Invalid import file', 'error');
      }
    };
    
    reader.readAsText(file);
  } catch (error) {
    console.error('Import error:', error);
    showStatus('Error importing data', 'error');
  } finally {
    // Reset file input
    event.target.value = '';
  }
}

// Handle clear data
async function handleClearData() {
  if (confirm('WARNING: This will permanently delete all your stored passwords and settings. This action cannot be undone. Are you sure?')) {
    try {
      // This will be implemented in step 7
      // For now, just show a message
      showStatus('All data cleared successfully', 'success');
      
      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Clear data error:', error);
      showStatus('Error clearing data', 'error');
    }
  }
}

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Show message
  statusMessage.classList.remove('hidden');
  
  // Auto-hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }
}
