// Secure password generator

/**
 * Generates a secure random password based on the specified options
 * @param {Object} options - The password generation options
 * @param {number} options.length - The length of the password to generate
 * @param {boolean} options.uppercase - Whether to include uppercase letters
 * @param {boolean} options.lowercase - Whether to include lowercase letters
 * @param {boolean} options.numbers - Whether to include numbers
 * @param {boolean} options.symbols - Whether to include symbols
 * @returns {string} The generated password
 */
export function generatePassword(options = {}) {
  const defaults = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  };
  
  const config = { ...defaults, ...options };
  
  // Ensure at least one character type is selected
  if (!config.uppercase && !config.lowercase && !config.numbers && !config.symbols) {
    config.lowercase = true; // Default to lowercase if nothing selected
  }
  
  // Define character sets
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_-+={}[]|:;<>,.?/'
  };
  
  // Create the character pool based on selected options
  let charPool = '';
  if (config.uppercase) charPool += charSets.uppercase;
  if (config.lowercase) charPool += charSets.lowercase;
  if (config.numbers) charPool += charSets.numbers;
  if (config.symbols) charPool += charSets.symbols;
  
  // Generate the password using the Web Crypto API for better randomness
  let password = '';
  const randomValues = new Uint32Array(config.length);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < config.length; i++) {
    password += charPool[randomValues[i] % charPool.length];
  }
  
  // Ensure the password contains at least one character from each selected type
  const types = [];
  if (config.uppercase) types.push('uppercase');
  if (config.lowercase) types.push('lowercase');
  if (config.numbers) types.push('numbers');
  if (config.symbols) types.push('symbols');
  
  // Check if password meets requirements
  let meetsRequirements = types.every(type => {
    return [...password].some(char => charSets[type].includes(char));
  });
  
  // If it doesn't meet requirements, regenerate
  if (!meetsRequirements && types.length > 1 && config.length >= types.length) {
    return generatePassword(config);
  }
  
  return password;
}

/**
 * Evaluates the strength of a password
 * @param {string} password - The password to evaluate
 * @returns {Object} The strength evaluation result
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: 'None' };
  }
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Not just letters or numbers
  if (!/^[A-Za-z]+$/.test(password) && !/^[0-9]+$/.test(password)) score += 1;
  
  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor(score / 2));
  
  const labels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  
  return {
    score: normalizedScore,
    label: labels[normalizedScore]
  };
}
