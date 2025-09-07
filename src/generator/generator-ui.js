/**
 * Password Generator UI
 */

import { 
  generatePassword, 
  evaluatePasswordStrength,
  generatePassphrase,
  generatePIN
} from './generator.js';

import {
  getPasswordSettings,
  savePasswordSettings,
  mapSettingsToOptions
} from './password-settings.js';

// DOM Elements
let generatedOutput, strengthMeter, strengthText, strengthFeedback;
let currentTab = 'password';
let passwordSettings = {};

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  initializeElements();
  setupEventListeners();
  passwordSettings = await getPasswordSettings();
  loadSettings();
  generateNewPassword();
});

// Initialize DOM elements
function initializeElements() {
  generatedOutput = document.getElementById('generatedOutput');
  strengthMeter = document.getElementById('strengthMeter');
  strengthText = document.getElementById('strengthText');
  strengthFeedback = document.getElementById('strengthFeedback');
  
  // Initialize tabs
  document.getElementById('passwordTabBtn').classList.add('active');
  document.getElementById('passwordSettings').classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.getElementById('passwordTabBtn').addEventListener('click', () => switchTab('password'));
  document.getElementById('passphraseTabBtn').addEventListener('click', () => switchTab('passphrase'));
  document.getElementById('pinTabBtn').addEventListener('click', () => switchTab('pin'));
  
  // Copy and refresh buttons
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  document.getElementById('refreshBtn').addEventListener('click', generateNewPassword);
  
  // Action buttons
  document.getElementById('usePasswordBtn').addEventListener('click', usePassword);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  
  // Advanced options toggle
  document.getElementById('showAdvancedBtn').addEventListener('click', toggleAdvancedOptions);
  
  // Password settings events
  setupPasswordSettingsEvents();
  
  // Passphrase settings events
  setupPassphraseSettingsEvents();
  
  // PIN settings events
  setupPinSettingsEvents();
}

// Setup events for password settings
function setupPasswordSettingsEvents() {
  const passwordLength = document.getElementById('passwordLength');
  const lengthValue = document.getElementById('lengthValue');
  
  // Update length display and possibly regenerate
  passwordLength.addEventListener('input', () => {
    lengthValue.textContent = passwordLength.value;
    if (passwordSettings.autoRegenerateOnOptionChange) {
      generateNewPassword();
    }
  });
  
  // Setup checkbox events
  const checkboxes = ['uppercase', 'lowercase', 'numbers', 'symbols', 
                      'excludeAmbiguous', 'excludeSimilar', 'avoidConsecutive', 'avoidRepeats'];
  
  checkboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (passwordSettings.autoRegenerateOnOptionChange) {
          generateNewPassword();
        }
      });
    }
  });
  
  // Setup text input events
  const textInputs = ['requiredChars', 'excludedChars'];
  
  textInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        if (passwordSettings.autoRegenerateOnOptionChange) {
          generateNewPassword();
        }
      });
    }
  });
}

// Setup events for passphrase settings
function setupPassphraseSettingsEvents() {
  const wordCount = document.getElementById('wordCount');
  const wordCountValue = document.getElementById('wordCountValue');
  
  // Update word count display and possibly regenerate
  wordCount.addEventListener('input', () => {
    wordCountValue.textContent = wordCount.value;
    if (passwordSettings.autoRegenerateOnOptionChange) {
      generateNewPassword();
    }
  });
  
  // Setup checkbox events
  const checkboxes = ['capitalize', 'includeNumber', 'includeSymbol'];
  
  checkboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (passwordSettings.autoRegenerateOnOptionChange) {
          generateNewPassword();
        }
      });
    }
  });
  
  // Separator dropdown
  document.getElementById('separator').addEventListener('change', () => {
    if (passwordSettings.autoRegenerateOnOptionChange) {
      generateNewPassword();
    }
  });
}

// Setup events for PIN settings
function setupPinSettingsEvents() {
  const pinLength = document.getElementById('pinLength');
  const pinLengthValue = document.getElementById('pinLengthValue');
  
  // Update PIN length display and possibly regenerate
  pinLength.addEventListener('input', () => {
    pinLengthValue.textContent = pinLength.value;
    if (passwordSettings.autoRegenerateOnOptionChange) {
      generateNewPassword();
    }
  });
  
  // Setup checkbox events
  const checkboxes = ['pinAvoidRepeats', 'pinAvoidConsecutive'];
  
  checkboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (passwordSettings.autoRegenerateOnOptionChange) {
          generateNewPassword();
        }
      });
    }
  });
}

// Switch between tabs
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${tab}TabBtn`).classList.add('active');
  
  // Update settings panels
  document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(`${tab}Settings`).classList.add('active');
  
  // Generate new password/passphrase/PIN
  generateNewPassword();
}

// Toggle advanced options
function toggleAdvancedOptions() {
  const advancedSettings = document.getElementById('advancedSettings');
  const showAdvancedBtn = document.getElementById('showAdvancedBtn');
  
  if (advancedSettings.style.display === 'none') {
    advancedSettings.style.display = 'block';
    showAdvancedBtn.textContent = 'Hide Advanced Options';
  } else {
    advancedSettings.style.display = 'none';
    showAdvancedBtn.textContent = 'Show Advanced Options';
  }
}

// Generate new password/passphrase/PIN based on current tab
function generateNewPassword() {
  const options = getCurrentOptions();
  let result = '';
  
  try {
    if (currentTab === 'password') {
      result = generatePassword(options);
    } else if (currentTab === 'passphrase') {
      result = generatePassphrase(options);
    } else if (currentTab === 'pin') {
      result = generatePIN(options);
    }
    
    generatedOutput.value = result;
    updateStrengthMeter(result);
  } catch (error) {
    console.error('Error generating password:', error);
    showToast('Error: ' + error.message);
  }
}

// Get current options based on UI state
function getCurrentOptions() {
  if (currentTab === 'password') {
    return {
      length: parseInt(document.getElementById('passwordLength').value),
      uppercase: document.getElementById('uppercase').checked,
      lowercase: document.getElementById('lowercase').checked,
      numbers: document.getElementById('numbers').checked,
      symbols: document.getElementById('symbols').checked,
      excludeAmbiguous: document.getElementById('excludeAmbiguous').checked,
      excludeSimilar: document.getElementById('excludeSimilar').checked,
      noConsecutive: document.getElementById('avoidConsecutive').checked,
      noRepeats: document.getElementById('avoidRepeats').checked,
      required: document.getElementById('requiredChars').value,
      excluded: document.getElementById('excludedChars').value
    };
  } else if (currentTab === 'passphrase') {
    return {
      words: parseInt(document.getElementById('wordCount').value),
      capitalize: document.getElementById('capitalize').checked,
      includeNumber: document.getElementById('includeNumber').checked,
      includeSymbol: document.getElementById('includeSymbol').checked,
      separator: document.getElementById('separator').value
    };
  } else if (currentTab === 'pin') {
    return {
      length: parseInt(document.getElementById('pinLength').value),
      noRepeats: document.getElementById('pinAvoidRepeats').checked,
      noConsecutive: document.getElementById('pinAvoidConsecutive').checked
    };
  }
  
  return {};
}

// Update strength meter
function updateStrengthMeter(password) {
  const strength = evaluatePasswordStrength(password);
  
  // Update UI
  strengthMeter.className = 'meter-fill strength-' + strength.score;
  strengthText.textContent = strength.label;
  
  if (strength.feedback) {
    strengthFeedback.textContent = strength.feedback;
    strengthFeedback.style.display = 'block';
  } else {
    strengthFeedback.style.display = 'none';
  }
}

// Copy to clipboard
function copyToClipboard() {
  generatedOutput.select();
  document.execCommand('copy');
  
  // Deselect
  window.getSelection().removeAllRanges();
  
  // Show toast notification
  showToast('Copied to clipboard!');
}

// Use password (send message to the parent/opener)
function usePassword() {
  const password = generatedOutput.value;
  
  // Depending on how this is opened, we use different methods to pass back the password
  if (window.opener) {
    // If opened as a popup
    window.opener.postMessage({ type: 'password-generated', password }, '*');
    window.close();
  } else {
    // If opened within extension
    chrome.runtime.sendMessage({
      action: 'passwordGenerated',
      password: password
    });
    
    // Close if this is a popup
    if (window.location.href.includes('popup=true')) {
      window.close();
    }
  }
}

// Save current settings
async function saveSettings() {
  // Get all settings from UI
  const settings = {
    // Password settings
    passwordLength: parseInt(document.getElementById('passwordLength').value),
    useUppercase: document.getElementById('uppercase').checked,
    useLowercase: document.getElementById('lowercase').checked,
    useNumbers: document.getElementById('numbers').checked,
    useSymbols: document.getElementById('symbols').checked,
    excludeAmbiguous: document.getElementById('excludeAmbiguous').checked,
    excludeSimilar: document.getElementById('excludeSimilar').checked,
    avoidConsecutive: document.getElementById('avoidConsecutive').checked,
    avoidRepeats: document.getElementById('avoidRepeats').checked,
    
    // Passphrase settings
    passphraseWordCount: parseInt(document.getElementById('wordCount').value),
    passphraseCapitalize: document.getElementById('capitalize').checked,
    passphraseIncludeNumber: document.getElementById('includeNumber').checked,
    passphraseIncludeSymbol: document.getElementById('includeSymbol').checked,
    passphraseSeparator: document.getElementById('separator').value,
    
    // PIN settings
    pinLength: parseInt(document.getElementById('pinLength').value),
    pinAvoidRepeats: document.getElementById('pinAvoidRepeats').checked,
    pinAvoidConsecutive: document.getElementById('pinAvoidConsecutive').checked,
    
    // Preserve other settings
    defaultGeneratorType: currentTab,
    autoRegenerateOnOptionChange: passwordSettings.autoRegenerateOnOptionChange,
    saveGeneratorSettings: true
  };
  
  try {
    await savePasswordSettings(settings);
    passwordSettings = settings;
    showToast('Settings saved!');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings');
  }
}

// Load settings from storage
function loadSettings() {
  if (!passwordSettings) return;
  
  // Set default tab
  if (passwordSettings.defaultGeneratorType) {
    switchTab(passwordSettings.defaultGeneratorType);
  }
  
  // Load password settings
  document.getElementById('passwordLength').value = passwordSettings.passwordLength || 16;
  document.getElementById('lengthValue').textContent = passwordSettings.passwordLength || 16;
  document.getElementById('uppercase').checked = passwordSettings.useUppercase !== false;
  document.getElementById('lowercase').checked = passwordSettings.useLowercase !== false;
  document.getElementById('numbers').checked = passwordSettings.useNumbers !== false;
  document.getElementById('symbols').checked = passwordSettings.useSymbols !== false;
  
  // Advanced password settings
  document.getElementById('excludeAmbiguous').checked = passwordSettings.excludeAmbiguous || false;
  document.getElementById('excludeSimilar').checked = passwordSettings.excludeSimilar || false;
  document.getElementById('avoidConsecutive').checked = passwordSettings.avoidConsecutive || false;
  document.getElementById('avoidRepeats').checked = passwordSettings.avoidRepeats || false;
  
  // Load passphrase settings
  document.getElementById('wordCount').value = passwordSettings.passphraseWordCount || 4;
  document.getElementById('wordCountValue').textContent = passwordSettings.passphraseWordCount || 4;
  document.getElementById('capitalize').checked = passwordSettings.passphraseCapitalize !== false;
  document.getElementById('includeNumber').checked = passwordSettings.passphraseIncludeNumber !== false;
  document.getElementById('includeSymbol').checked = passwordSettings.passphraseIncludeSymbol !== false;
  
  if (passwordSettings.passphraseSeparator !== undefined) {
    document.getElementById('separator').value = passwordSettings.passphraseSeparator;
  }
  
  // Load PIN settings
  document.getElementById('pinLength').value = passwordSettings.pinLength || 4;
  document.getElementById('pinLengthValue').textContent = passwordSettings.pinLength || 4;
  document.getElementById('pinAvoidRepeats').checked = passwordSettings.pinAvoidRepeats || false;
  document.getElementById('pinAvoidConsecutive').checked = passwordSettings.pinAvoidConsecutive || false;
}

// Show toast notification
function showToast(message, duration = 2000) {
  // Check if there's already a toast
  let toast = document.querySelector('.toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
