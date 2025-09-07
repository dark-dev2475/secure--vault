/**
 * Password Settings Module
 * Handles saving/loading password generation preferences
 */

import { saveSettings, getSettings } from '../storage/storage.js';

// Default password settings
const DEFAULT_PASSWORD_SETTINGS = {
  // Password generator settings
  passwordLength: 16,
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  useSymbols: true,
  excludeAmbiguous: false,
  excludeSimilar: false,
  avoidConsecutive: false,
  avoidRepeats: false,
  
  // Passphrase settings
  passphraseWordCount: 4,
  passphraseCapitalize: true,
  passphraseIncludeNumber: true,
  passphraseIncludeSymbol: true,
  passphraseSeparator: '-',
  
  // PIN settings
  pinLength: 4,
  pinAvoidRepeats: false,
  pinAvoidConsecutive: false,
  
  // General settings
  defaultGeneratorType: 'password', // 'password', 'passphrase', or 'pin'
  autoRegenerateOnOptionChange: true,
  saveGeneratorSettings: true,
};

/**
 * Gets the saved password generator settings or defaults
 * @returns {Promise<Object>} The password generator settings
 */
export async function getPasswordSettings() {
  try {
    const settings = await getSettings('passwordGeneratorSettings');
    return settings || DEFAULT_PASSWORD_SETTINGS;
  } catch (error) {
    console.error('Error retrieving password settings:', error);
    return DEFAULT_PASSWORD_SETTINGS;
  }
}

/**
 * Saves the password generator settings
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
export async function savePasswordSettings(settings) {
  try {
    await saveSettings('passwordGeneratorSettings', {
      ...DEFAULT_PASSWORD_SETTINGS,
      ...settings
    });
  } catch (error) {
    console.error('Error saving password settings:', error);
  }
}

/**
 * Maps password settings to generator options
 * @param {Object} settings - The password settings
 * @param {string} type - The type of generator ('password', 'passphrase', 'pin')
 * @returns {Object} Options for the generator function
 */
export function mapSettingsToOptions(settings, type = 'password') {
  if (type === 'password') {
    return {
      length: settings.passwordLength,
      uppercase: settings.useUppercase,
      lowercase: settings.useLowercase,
      numbers: settings.useNumbers,
      symbols: settings.useSymbols,
      excludeAmbiguous: settings.excludeAmbiguous,
      excludeSimilar: settings.excludeSimilar,
      noConsecutive: settings.avoidConsecutive,
      noRepeats: settings.avoidRepeats
    };
  } else if (type === 'passphrase') {
    return {
      words: settings.passphraseWordCount,
      capitalize: settings.passphraseCapitalize,
      includeNumber: settings.passphraseIncludeNumber,
      includeSymbol: settings.passphraseIncludeSymbol,
      separator: settings.passphraseSeparator
    };
  } else if (type === 'pin') {
    return {
      length: settings.pinLength,
      noRepeats: settings.pinAvoidRepeats,
      noConsecutive: settings.pinAvoidConsecutive
    };
  }
  
  return {};
}
