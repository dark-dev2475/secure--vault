// Content script for detecting login forms and autofill
import { getSettings } from '../storage/storage.js';

// Constants
const SETTINGS_ID = 'user-settings';
const FORM_OBSERVED_ATTR = 'data-secure-shelf-observed';
const ICON_SIZE = 20;

// State
let settings = null;
let formObserver = null;
let credentialsForPage = null;

// Initialize
(async function init() {
  try {
    // Load settings
    settings = await getSettings(SETTINGS_ID);
    
    // Default settings if none found
    if (!settings) {
      settings = {
        autofillEnabled: true,
        autofillIconEnabled: true,
        autofillConfirmation: true
      };
    }
    
    // Listen for messages from background script
    setupMessageListener();

    // If autofill is disabled, don't continue
    if (!settings.autofillEnabled) {
      return;
    }
    
    // Request credentials for current page
    requestCredentialsForCurrentPage();
    
    // Start observing for forms
    startFormObserver();
    
    // Scan for existing forms
    scanForForms();
    
  } catch (error) {
    console.error('Content script initialization error:', error);
  }
})();

// Request credentials for current page
function requestCredentialsForCurrentPage() {
  chrome.runtime.sendMessage({
    action: 'getCredentialsForUrl',
    url: window.location.href
  }, response => {
    if (response && response.credentials) {
      credentialsForPage = response.credentials;
      
      // If we have credentials, check for forms again
      scanForForms();
    }
  });
}

// Start form observer
function startFormObserver() {
  // If we already have an observer, disconnect it
  if (formObserver) {
    formObserver.disconnect();
  }
  
  // Create a new observer
  formObserver = new MutationObserver(mutations => {
    let shouldScan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        shouldScan = true;
        break;
      }
    }
    
    if (shouldScan) {
      scanForForms();
    }
  });
  
  // Start observing
  formObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Scan for forms
function scanForForms() {
  const forms = document.querySelectorAll('form:not([' + FORM_OBSERVED_ATTR + '])');
  
  forms.forEach(form => {
    // Mark as observed
    form.setAttribute(FORM_OBSERVED_ATTR, 'true');
    
    // Find username and password fields
    const fields = findFormFields(form);
    
    // If we found fields, enhance them
    if (fields.usernameField || fields.passwordField) {
      enhanceForm(form, fields);
    }
  });
  
  // Also look for standalone password fields (not in forms)
  const standaloneFields = findStandaloneFields();
  if (standaloneFields.length > 0) {
    enhanceStandaloneFields(standaloneFields);
  }
}

// Find username and password fields in a form
function findFormFields(form) {
  const result = {
    usernameField: null,
    passwordField: null
  };
  
  // Find password field first
  const passwordFields = form.querySelectorAll('input[type="password"]');
  if (passwordFields.length > 0) {
    result.passwordField = passwordFields[0]; // Use the first password field
    
    // Now look for username field (typically before the password field)
    const inputs = Array.from(form.querySelectorAll('input'));
    const passwordIndex = inputs.indexOf(result.passwordField);
    
    if (passwordIndex > 0) {
      // Look for likely username fields before the password
      for (let i = 0; i < passwordIndex; i++) {
        const input = inputs[i];
        const type = input.type.toLowerCase();
        
        // Skip hidden, submit, button, etc.
        if (type === 'hidden' || type === 'submit' || type === 'button' || 
            type === 'checkbox' || type === 'radio') {
          continue;
        }
        
        // Check attributes for clues
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const autocomplete = (input.autocomplete || '').toLowerCase();
        
        if (name.includes('user') || name.includes('email') || name.includes('login') ||
            id.includes('user') || id.includes('email') || id.includes('login') ||
            placeholder.includes('user') || placeholder.includes('email') || placeholder.includes('login') ||
            autocomplete === 'username' || autocomplete === 'email') {
          result.usernameField = input;
          break;
        }
        
        // If we haven't found a username field by specific attributes,
        // use the input right before the password field
        if (i === passwordIndex - 1) {
          result.usernameField = input;
        }
      }
    }
  }
  
  return result;
}

// Find standalone password fields (not in forms)
function findStandaloneFields() {
  const result = [];
  
  // Look for password fields not inside forms
  const allPasswordFields = document.querySelectorAll('input[type="password"]');
  
  allPasswordFields.forEach(field => {
    // Check if this field is inside a form
    let parent = field.parentElement;
    let insideForm = false;
    
    while (parent && parent !== document.body) {
      if (parent.tagName === 'FORM') {
        insideForm = true;
        break;
      }
      parent = parent.parentElement;
    }
    
    if (!insideForm) {
      // Look for a username field nearby
      const possibleUsername = findNearbyUsernameField(field);
      result.push({
        passwordField: field,
        usernameField: possibleUsername
      });
    }
  });
  
  return result;
}

// Find a username field near a standalone password field
function findNearbyUsernameField(passwordField) {
  // Try siblings first
  let previousSibling = passwordField.previousElementSibling;
  while (previousSibling) {
    if (previousSibling.tagName === 'INPUT' && 
        previousSibling.type !== 'password' &&
        previousSibling.type !== 'hidden' &&
        previousSibling.type !== 'submit' &&
        previousSibling.type !== 'button') {
      return previousSibling;
    }
    previousSibling = previousSibling.previousElementSibling;
  }
  
  // Try parent's children
  if (passwordField.parentElement) {
    const siblings = Array.from(passwordField.parentElement.children);
    const pwIndex = siblings.indexOf(passwordField);
    
    for (let i = 0; i < pwIndex; i++) {
      const sibling = siblings[i];
      if (sibling.tagName === 'INPUT' && 
          sibling.type !== 'password' &&
          sibling.type !== 'hidden' &&
          sibling.type !== 'submit' &&
          sibling.type !== 'button') {
        return sibling;
      }
    }
  }
  
  return null;
}

// Enhance a form with autofill functionality
function enhanceForm(form, fields) {
  if (!credentialsForPage || credentialsForPage.length === 0) {
    return;
  }
  
  // If we have autofill icons enabled, add them
  if (settings.autofillIconEnabled) {
    if (fields.usernameField) {
      addAutofillIcon(fields.usernameField);
    }
    
    if (fields.passwordField) {
      addAutofillIcon(fields.passwordField);
    }
  }
  
  // Listen for submit event to capture new credentials
  form.addEventListener('submit', () => {
    if (fields.usernameField && fields.passwordField && 
        fields.usernameField.value && fields.passwordField.value) {
      const newCredential = {
        url: window.location.origin,
        username: fields.usernameField.value,
        password: fields.passwordField.value
      };
      
      // Check if we already have this credential
      const exists = credentialsForPage.some(cred => 
        cred.username === newCredential.username && 
        cred.password === newCredential.password
      );
      
      if (!exists) {
        // Ask if user wants to save this credential
        chrome.runtime.sendMessage({
          action: 'saveNewCredential',
          credential: newCredential
        });
      }
    }
  });
}

// Enhance standalone fields
function enhanceStandaloneFields(fieldsArray) {
  if (!credentialsForPage || credentialsForPage.length === 0) {
    return;
  }
  
  fieldsArray.forEach(fields => {
    if (settings.autofillIconEnabled) {
      if (fields.usernameField) {
        addAutofillIcon(fields.usernameField);
      }
      
      if (fields.passwordField) {
        addAutofillIcon(fields.passwordField);
      }
    }
  });
}

// Add autofill icon to a field
function addAutofillIcon(field) {
  // Check if icon already exists
  if (field.parentElement.querySelector('.secure-shelf-autofill-icon')) {
    return;
  }
  
  // Create icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'secure-shelf-autofill-icon';
  iconContainer.style.cssText = `
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: ${ICON_SIZE}px;
    height: ${ICON_SIZE}px;
    background-color: rgba(52, 152, 219, 0.8);
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: white;
    user-select: none;
  `;
  
  // Create the icon content (key symbol)
  iconContainer.textContent = '🔑';
  
  // Position the field's container as relative if it's not already
  if (getComputedStyle(field.parentElement).position === 'static') {
    field.parentElement.style.position = 'relative';
  }
  
  // Add click handler to show credentials dropdown
  iconContainer.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.secure-shelf-credentials-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // Create credentials dropdown
    showCredentialsDropdown(field, iconContainer);
  });
  
  // Append icon to the field's parent
  field.parentElement.appendChild(iconContainer);
  
  // Adjust input padding to prevent overlap
  field.style.paddingRight = `${ICON_SIZE + 10}px`;
}

// Show credentials dropdown
function showCredentialsDropdown(field, iconElement) {
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'secure-shelf-credentials-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: ${field.offsetHeight + 5}px;
    right: 0;
    width: 250px;
    max-height: 200px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    padding: 5px 0;
  `;
  
  // Position dropdown relative to the input's parent
  if (getComputedStyle(field.parentElement).position === 'static') {
    field.parentElement.style.position = 'relative';
  }
  
  // Add credentials to dropdown
  credentialsForPage.forEach(credential => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 14px;
    `;
    
    const username = document.createElement('div');
    username.textContent = credential.username;
    username.style.fontWeight = 'bold';
    
    const url = document.createElement('div');
    url.textContent = credential.url;
    url.style.cssText = `
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    
    item.appendChild(username);
    item.appendChild(url);
    
    // Hover effect
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f5f5f5';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'white';
    });
    
    // Click handler
    item.addEventListener('click', () => {
      autofillCredential(credential);
      dropdown.remove();
    });
    
    dropdown.appendChild(item);
  });
  
  // Add dropdown to the page
  field.parentElement.appendChild(dropdown);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!dropdown.contains(e.target) && e.target !== iconElement) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  });
}

// Autofill a credential
function autofillCredential(credential) {
  // If confirmation is required, ask first
  if (settings.autofillConfirmation) {
    if (!confirm(`Fill login details for ${credential.username}?`)) {
      return;
    }
  }
  
  // Find all username and password fields
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const fields = findFormFields(form);
    
    if (fields.usernameField) {
      fields.usernameField.value = credential.username;
      // Trigger input event to notify the page
      fields.usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      fields.usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (fields.passwordField) {
      fields.passwordField.value = credential.password;
      // Trigger input event to notify the page
      fields.passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      fields.passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  // Also fill standalone fields
  const standaloneFields = findStandaloneFields();
  
  standaloneFields.forEach(fields => {
    if (fields.usernameField) {
      fields.usernameField.value = credential.username;
      fields.usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      fields.usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (fields.passwordField) {
      fields.passwordField.value = credential.password;
      fields.passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      fields.passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

/**
 * Sets up message listener for background script communications
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Process all message types in one place
    if (message.action === 'requestFillCredential') {
      // Show credential selection UI near the active input
      showCredentialSelector();
      sendResponse({ success: true });
    } else if (message.action === 'requestGeneratePassword') {
      // Open password generator popup
      chrome.runtime.sendMessage({ 
        action: 'openPasswordGenerator', 
        targetField: getActiveInputIdentifier() 
      });
      sendResponse({ success: true });
    } else if (message.action === 'credentialsUpdated') {
      credentialsForPage = message.credentials;
      scanForForms();
      sendResponse({ success: true });
    } else if (message.action === 'fillCredential') {
      autofillCredential(message.credential);
      sendResponse({ success: true });
    }
    
    return true; // Indicate async response
  });
}

/**
 * Shows a UI for selecting credentials near the active input field
 */
function showCredentialSelector() {
  // Get the URL of the page to find matching credentials
  const url = window.location.href;
  
  // Request credentials from background
  chrome.runtime.sendMessage({ 
    action: 'getCredentialsForUrl', 
    url: url 
  }, (response) => {
    if (response && response.credentials && response.credentials.length > 0) {
      displayCredentialOptions(response.credentials);
    } else {
      showNotification('No saved credentials found for this site');
    }
  });
}

/**
 * Get identifier for the active input field
 */
function getActiveInputIdentifier() {
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    // Create a unique identifier for this input
    return {
      id: activeElement.id,
      name: activeElement.name,
      type: activeElement.type,
      form: activeElement.form ? activeElement.form.id : null
    };
  }
  return null;
}
