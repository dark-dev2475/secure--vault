// Secure password generator

/**
 * Generates a secure random password based on the specified options
 * @param {Object} options - The password generation options
 * @param {number} options.length - The length of the password to generate
 * @param {boolean} options.uppercase - Whether to include uppercase letters
 * @param {boolean} options.lowercase - Whether to include lowercase letters
 * @param {boolean} options.numbers - Whether to include numbers
 * @param {boolean} options.symbols - Whether to include symbols
 * @param {boolean} options.excludeAmbiguous - Whether to exclude ambiguous characters (1, l, I, 0, O, etc.)
 * @param {boolean} options.excludeSimilar - Whether to exclude similar characters (i, l, 1, L, o, 0, O)
 * @param {string} options.required - Characters that must be included
 * @param {string} options.excluded - Characters to exclude
 * @param {boolean} options.noConsecutive - Whether to avoid consecutive characters
 * @param {boolean} options.noRepeats - Whether to avoid repeating characters
 * @returns {string} The generated password
 */
export function generatePassword(options = {}) {
  const defaults = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    excludeSimilar: false,
    required: '',
    excluded: '',
    noConsecutive: false,
    noRepeats: false
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
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?/'
  };
  
  // Define ambiguous characters
  const ambiguousChars = '1lI0O{}[]()\/\'"`~,;:.<>';
  
  // Define similar characters
  const similarChars = 'il1Lo0O';
  
  // Create the character pool based on selected options
  let charPool = '';
  
  if (config.uppercase) {
    charPool += charSets.uppercase;
  }
  
  if (config.lowercase) {
    charPool += charSets.lowercase;
  }
  
  if (config.numbers) {
    charPool += charSets.numbers;
  }
  
  if (config.symbols) {
    charPool += charSets.symbols;
  }
  
  // Remove excluded characters
  if (config.excluded) {
    for (const char of config.excluded) {
      charPool = charPool.replace(new RegExp(escapeRegExp(char), 'g'), '');
    }
  }
  
  // Remove ambiguous characters if requested
  if (config.excludeAmbiguous) {
    for (const char of ambiguousChars) {
      charPool = charPool.replace(new RegExp(escapeRegExp(char), 'g'), '');
    }
  }
  
  // Remove similar characters if requested
  if (config.excludeSimilar) {
    for (const char of similarChars) {
      charPool = charPool.replace(new RegExp(escapeRegExp(char), 'g'), '');
    }
  }
  
  // Ensure we have characters to work with
  if (!charPool) {
    throw new Error('No characters available after applying exclusions');
  }
  
  // Generate the password
  let password = '';
  let attempt = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (attempt < maxAttempts) {
    attempt++;
    password = generateRandomPassword(config.length, charPool, config.noConsecutive, config.noRepeats);
    
    // Check if all required chars are included
    if (config.required) {
      let hasAllRequired = true;
      for (const char of config.required) {
        if (!password.includes(char)) {
          hasAllRequired = false;
          break;
        }
      }
      if (!hasAllRequired) {
        continue;
      }
    }
    
    // Check if password contains at least one character from each selected type
    let meetsRequirements = true;
    
    if (config.uppercase && !/[A-Z]/.test(password)) {
      meetsRequirements = false;
    }
    
    if (config.lowercase && !/[a-z]/.test(password)) {
      meetsRequirements = false;
    }
    
    if (config.numbers && !/[0-9]/.test(password)) {
      meetsRequirements = false;
    }
    
    if (config.symbols && !/[^A-Za-z0-9]/.test(password)) {
      meetsRequirements = false;
    }
    
    if (meetsRequirements) {
      break;
    }
  }
  
  if (attempt >= maxAttempts) {
    // Fallback to simpler generation if we can't meet all requirements
    return generateSimplePassword(config);
  }
  
  return password;
}

/**
 * Generates a random password with the given constraints
 * @private
 */
function generateRandomPassword(length, charPool, noConsecutive, noRepeats) {
  // Use the Web Crypto API for better randomness
  const randomValues = new Uint32Array(length * 2); // Get more values than needed
  window.crypto.getRandomValues(randomValues);
  
  let password = '';
  let lastChar = '';
  let usedChars = new Set();
  let randomIndex = 0;
  
  for (let i = 0; i < length; i++) {
    // Get a random character from the pool
    let nextChar;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    do {
      const randomValue = randomValues[randomIndex++];
      if (randomIndex >= randomValues.length) {
        // If we used all values, get more
        window.crypto.getRandomValues(randomValues);
        randomIndex = 0;
      }
      
      nextChar = charPool[randomValue % charPool.length];
      attempts++;
      
      // Check constraints
      if (noConsecutive && nextChar === lastChar) {
        continue;
      }
      
      if (noRepeats && usedChars.has(nextChar)) {
        continue;
      }
      
      // If we've tried too many times, relax constraints
      if (attempts >= maxAttempts) {
        break;
      }
    } while ((noConsecutive && nextChar === lastChar) || 
             (noRepeats && usedChars.has(nextChar)));
    
    password += nextChar;
    lastChar = nextChar;
    usedChars.add(nextChar);
  }
  
  return password;
}

/**
 * Generates a simple password as a fallback when constraints are too strict
 * @private
 */
function generateSimplePassword(config) {
  let charPool = '';
  
  if (config.uppercase) charPool += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No ambiguous I, O
  if (config.lowercase) charPool += 'abcdefghijkmnopqrstuvwxyz'; // No ambiguous l
  if (config.numbers) charPool += '23456789'; // No ambiguous 0, 1
  if (config.symbols) charPool += '!@#$%^&*()-_=+';
  
  if (!charPool) charPool = 'abcdefghijkmnopqrstuvwxyz23456789'; // Fallback
  
  const randomValues = new Uint32Array(config.length);
  window.crypto.getRandomValues(randomValues);
  
  let password = '';
  
  for (let i = 0; i < config.length; i++) {
    password += charPool[randomValues[i] % charPool.length];
  }
  
  return password;
}

/**
 * Escape special characters for use in a regular expression
 * @private
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Evaluates the strength of a password
 * @param {string} password - The password to evaluate
 * @returns {Object} The strength evaluation result
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: 'None', feedback: 'No password provided' };
  }
  
  let score = 0;
  let feedback = [];
  
  // Length score (up to 5 points)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  if (password.length >= 24) score += 1;
  
  // Entropy calculation (approximate)
  let entropy = 0;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  
  let charsetSize = 0;
  if (hasUppercase) charsetSize += 26;
  if (hasLowercase) charsetSize += 26;
  if (hasNumbers) charsetSize += 10;
  if (hasSymbols) charsetSize += 33; // Approximate number of symbols
  
  if (charsetSize > 0) {
    entropy = Math.log2(Math.pow(charsetSize, password.length));
  }
  
  // Adjust score based on entropy
  if (entropy > 50) score += 1;
  if (entropy > 60) score += 1;
  if (entropy > 80) score += 1;
  if (entropy > 100) score += 1;
  
  // Character variety (up to 4 points)
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSymbols) score += 1;
  
  // Deductions for common patterns
  
  // Sequences
  if (/(?:abcdef|qwerty|asdfgh|zxcvbn|12345|09876)/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequences of characters or numbers');
  }
  
  // Repeated characters
  const repeats = password.match(/(.)\1{2,}/g);
  if (repeats) {
    score -= repeats.length;
    feedback.push('Avoid repeating characters');
  }
  
  // Only letters or only numbers
  if (/^[A-Za-z]+$/.test(password)) {
    score -= 2;
    feedback.push('Add numbers and symbols');
  }
  
  if (/^[0-9]+$/.test(password)) {
    score -= 2;
    feedback.push('Add letters and symbols');
  }
  
  // Normalize to 0-4 scale
  const normalizedScore = Math.max(0, Math.min(4, Math.floor(score / 3)));
  
  const labels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  
  // Add general feedback
  if (normalizedScore <= 1) {
    feedback.push('Consider using a longer password with more variety');
  } else if (normalizedScore === 2) {
    feedback.push('Good start, but could be stronger with more complexity');
  } else if (normalizedScore === 3) {
    feedback.push('Strong password, but even more length adds security');
  } else {
    feedback.push('Excellent password strength');
  }
  
  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    entropy: Math.round(entropy),
    feedback: feedback.join('. ')
  };
}

/**
 * Generates a memorable password phrase
 * @param {Object} options - Options for generating the phrase
 * @param {number} options.words - Number of words to include
 * @param {boolean} options.capitalize - Whether to capitalize words
 * @param {boolean} options.includeNumber - Whether to include a number
 * @param {boolean} options.includeSymbol - Whether to include a symbol
 * @returns {string} The generated phrase
 */
export function generatePassphrase(options = {}) {
  const defaults = {
    words: 4,
    capitalize: true,
    includeNumber: true,
    includeSymbol: true,
    separator: '-'
  };
  
  const config = { ...defaults, ...options };
  
  // Simple word list for demonstration
  // In a real implementation, you'd use a much larger dictionary
  const words = [
    'apple', 'banana', 'carrot', 'diamond', 'elephant', 'forest',
    'garden', 'harbor', 'island', 'jungle', 'kitchen', 'lemon',
    'mountain', 'notebook', 'orange', 'penguin', 'quarter', 'river',
    'sunset', 'tiger', 'umbrella', 'violet', 'window', 'xylophone',
    'yellow', 'zebra', 'aircraft', 'butterfly', 'cactus', 'dolphin',
    'eagle', 'falcon', 'giraffe', 'harvest', 'igloo', 'jacket',
    'kangaroo', 'lighthouse', 'mushroom', 'nutmeg', 'octopus', 'panda',
    'quilt', 'rainbow', 'sailboat', 'tornado', 'unicorn', 'volcano',
    'waterfall', 'xylitol', 'yogurt', 'zucchini'
  ];
  
  // Generate random values
  const randomValues = new Uint32Array(config.words);
  window.crypto.getRandomValues(randomValues);
  
  // Select random words
  const selectedWords = [];
  for (let i = 0; i < config.words; i++) {
    const word = words[randomValues[i] % words.length];
    selectedWords.push(config.capitalize ? capitalizeFirstLetter(word) : word);
  }
  
  // Add a number if requested
  if (config.includeNumber) {
    const randomNum = new Uint32Array(1);
    window.crypto.getRandomValues(randomNum);
    selectedWords.push(String(randomNum[0] % 100 + 1)); // 1-100
  }
  
  // Add a symbol if requested
  if (config.includeSymbol) {
    const symbols = '!@#$%^&*';
    const randomSym = new Uint32Array(1);
    window.crypto.getRandomValues(randomSym);
    selectedWords.push(symbols[randomSym[0] % symbols.length]);
  }
  
  // Join with separator
  return selectedWords.join(config.separator);
}

/**
 * Capitalize the first letter of a string
 * @private
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Generates a PIN number
 * @param {Object} options - Options for generating the PIN
 * @param {number} options.length - Length of the PIN
 * @param {boolean} options.noRepeats - Whether to avoid repeating digits
 * @param {boolean} options.noConsecutive - Whether to avoid consecutive digits
 * @returns {string} The generated PIN
 */
export function generatePIN(options = {}) {
  const defaults = {
    length: 4,
    noRepeats: false,
    noConsecutive: false
  };
  
  const config = { ...defaults, ...options };
  
  // Validate options
  if (config.noRepeats && config.length > 10) {
    throw new Error('Cannot generate PIN with no repeats longer than 10 digits');
  }
  
  const digits = '0123456789';
  
  // Generate random values
  const randomValues = new Uint32Array(config.length * 2);
  window.crypto.getRandomValues(randomValues);
  
  let pin = '';
  let lastDigit = '';
  let usedDigits = new Set();
  
  for (let i = 0; i < config.length; i++) {
    let nextDigit;
    let attempts = 0;
    
    do {
      nextDigit = digits[randomValues[i * 2 + attempts] % 10];
      attempts++;
      
      if (attempts > 10) {
        // If we can't satisfy constraints, start over
        return generatePIN({
          ...config,
          noRepeats: false,  // Relax constraints
          noConsecutive: false
        });
      }
    } while ((config.noConsecutive && Math.abs(parseInt(nextDigit) - parseInt(lastDigit || '0')) === 1) ||
             (config.noRepeats && usedDigits.has(nextDigit)));
    
    pin += nextDigit;
    lastDigit = nextDigit;
    usedDigits.add(nextDigit);
  }
  
  return pin;
}
