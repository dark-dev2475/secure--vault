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
let userAutoLockMinutes = 5; // Cache the auto-lock setting

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
    
    // Also scan on window load to catch late-rendered forms
    window.addEventListener('load', () => {
      setTimeout(scanForForms, 1000);
    });
    
    // And scan on DOM changes that might indicate SPA navigation
    const bodyObserver = new MutationObserver(() => {
      setTimeout(scanForForms, 500);
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    
    // Listen for URL changes in SPAs
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('URL changed to:', lastUrl);
        setTimeout(() => {
          requestCredentialsForCurrentPage();
          scanForForms();
        }, 500);
      }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
    
    // Listen for specific SPA framework events
    window.addEventListener('popstate', () => {
      console.log('History state changed');
      setTimeout(scanForForms, 500);
    });
    
    // For React, Angular, Vue, etc. navigation
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(scanForForms, 1000);
    });
    
    // Monitor AJAX requests to catch dynamically loaded forms
    monitorAjaxRequests();
    
    // Monitor user activity to reset auto-lock timer
    setupActivityMonitoring();
    
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
  console.log('Scanning for forms on page:', window.location.href);
  
  // First look for standard forms
  const forms = document.querySelectorAll('form:not([' + FORM_OBSERVED_ATTR + '])');
  console.log(`Found ${forms.length} unprocessed forms`);
  
  forms.forEach(form => {
    // Mark as observed
    form.setAttribute(FORM_OBSERVED_ATTR, 'true');
    
    // Find username and password fields
    const fields = findFormFields(form);
    
    // If we found fields, enhance them
    if (fields.usernameField || fields.passwordField) {
      console.log('Found login form:', fields);
      enhanceForm(form, fields);
    }
  });
  
  // Also look for standalone password fields (not in forms)
  const standaloneFields = findStandaloneFields();
  if (standaloneFields.length > 0) {
    console.log(`Found ${standaloneFields.length} standalone login fields`);
    enhanceStandaloneFields(standaloneFields);
  }
  
  // Look for containers that might be login forms but aren't actual <form> elements
  // This helps with modern web apps that don't use standard forms
  findPseudoForms();
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

/**
 * Find containers that look like login forms but aren't standard <form> elements
 * This helps detect login forms in modern SPAs and frameworks
 */
function findPseudoForms() {
  // Look for common login form containers
  const possibleContainers = [
    ...document.querySelectorAll('div[class*="login"]:not([' + FORM_OBSERVED_ATTR + '])'),
    ...document.querySelectorAll('div[class*="signin"]:not([' + FORM_OBSERVED_ATTR + '])'),
    ...document.querySelectorAll('div[class*="auth"]:not([' + FORM_OBSERVED_ATTR + '])'),
    ...document.querySelectorAll('div[id*="login"]:not([' + FORM_OBSERVED_ATTR + '])'),
    ...document.querySelectorAll('div[id*="signin"]:not([' + FORM_OBSERVED_ATTR + '])'),
    ...document.querySelectorAll('div[id*="auth"]:not([' + FORM_OBSERVED_ATTR + '])')
  ];
  
  // Also look for specific patterns like an input followed by a password field
  const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
  const inputPairs = [];
  
  for (let i = 0; i < allInputs.length - 1; i++) {
    const currentInput = allInputs[i];
    const nextInput = allInputs[i + 1];
    
    // If we have a text input followed by a password input, likely a login form
    if ((currentInput.type === 'text' || currentInput.type === 'email') && 
        nextInput.type === 'password' &&
        !currentInput.closest('form') && !nextInput.closest('form')) {
      
      // Find a common parent
      let parent = currentInput.parentElement;
      while (parent && !parent.contains(nextInput)) {
        parent = parent.parentElement;
      }
      
      if (parent && !parent.hasAttribute(FORM_OBSERVED_ATTR)) {
        parent.setAttribute(FORM_OBSERVED_ATTR, 'true');
        possibleContainers.push(parent);
      }
    }
  }
  
  // Process each potential login container
  possibleContainers.forEach(container => {
    container.setAttribute(FORM_OBSERVED_ATTR, 'true');
    
    // Find inputs inside this container
    const inputs = container.querySelectorAll('input');
    if (inputs.length < 2) return; // Need at least 2 inputs for a login form
    
    const fields = {
      usernameField: null,
      passwordField: null
    };
    
    // Find password field first
    const passwordFields = container.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0) {
      fields.passwordField = passwordFields[0];
      
      // Now look for a username field
      const otherInputs = Array.from(inputs).filter(
        input => input !== fields.passwordField && 
                 input.type !== 'hidden' && 
                 input.type !== 'submit' && 
                 input.type !== 'button'
      );
      
      if (otherInputs.length > 0) {
        fields.usernameField = otherInputs[0]; // Take the first non-password field as username
      }
      
      if (fields.usernameField || fields.passwordField) {
        console.log('Found pseudo-form login:', container, fields);
        enhanceForm(container, fields);
      }
    }
  });
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

/**
 * Monitors AJAX requests to detect content loading
 * This helps catch forms loaded by AJAX in single-page applications
 */
function monitorAjaxRequests() {
  // Save original XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  
  // Create new constructor
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    
    // Override the onreadystatechange property
    const originalOnReadyStateChange = xhr.onreadystatechange;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        // AJAX request completed
        console.log('AJAX request completed');
        // Wait a bit for DOM to update
        setTimeout(() => {
          scanForForms();
        }, 500);
      }
      
      // Call original handler
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };
    
    return xhr;
  };

  // Also monitor fetch API
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments)
      .then(response => {
        // Request completed
        setTimeout(() => {
          scanForForms();
        }, 500);
        return response;
      });
  };
}

/**
 * Setup activity monitoring to reset auto-lock timer
 */
function setupActivityMonitoring() {
  let lastActivity = Date.now();
  
  // Get user auto-lock setting
  getSettings('user-settings').then(userSettings => {
    if (userSettings && userSettings.autoLockTime > 0) {
      userAutoLockMinutes = userSettings.autoLockTime;
    }
  });
  
  // Monitor various user activities
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const resetTimer = () => {
    const now = Date.now();
    // Only reset timer if enough time has passed since last reset (prevent spam)
    if (now - lastActivity > 30000) { // 30 seconds
      lastActivity = now;
      
      // Tell background script to reset the timer
      chrome.runtime.sendMessage({
        action: 'resetAutoLockTimer',
        lockAfterMinutes: userAutoLockMinutes
      }).catch(() => {
        // Ignore errors if background script is not available
      });
    }
  };
  
  // Add event listeners for activity
  activityEvents.forEach(eventType => {
    document.addEventListener(eventType, resetTimer, { passive: true });
  });
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

  // Helper to fill a field and trigger all relevant events
  function fillField(field, value) {
    if (!field) return;
    field.focus();
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    // For React/Vue/Angular sites
    field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
  }

  // Try to fill all forms
  let filled = false;
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const fields = findFormFields(form);
    if (fields.usernameField && credential.username) {
      fillField(fields.usernameField, credential.username);
      filled = true;
    }
    if (fields.passwordField && credential.password) {
      fillField(fields.passwordField, credential.password);
      filled = true;
    }
  });

  // Also fill standalone fields
  const standaloneFields = findStandaloneFields();
  standaloneFields.forEach(fields => {
    if (fields.usernameField && credential.username) {
      fillField(fields.usernameField, credential.username);
      filled = true;
    }
    if (fields.passwordField && credential.password) {
      fillField(fields.passwordField, credential.password);
      filled = true;
    }
  });

  // Fallback: try to fill any visible input fields if nothing was filled
  if (!filled) {
    const allInputs = Array.from(document.querySelectorAll('input'));
    const userCandidates = allInputs.filter(i => i.type !== 'password' && i.offsetParent !== null);
    const passCandidates = allInputs.filter(i => i.type === 'password' && i.offsetParent !== null);
    if (userCandidates.length && credential.username) fillField(userCandidates[0], credential.username);
    if (passCandidates.length && credential.password) fillField(passCandidates[0], credential.password);
  }
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
