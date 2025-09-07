# Secure Shelf - A Client-Side Encrypted Password Manager

Secure Shelf is a browser extension that provides secure password management with complete client-side encryption. All encryption happens locally in your browser, ensuring that even if the database is compromised, attackers only get encrypted data.

## Features

- **Client-Side Encryption**: All encryption/decryption happens locally using AES-256-GCM
- **Strong Master Password**: PBKDF2 key derivation with high iteration count
- **Auto-Fill**: Detects login forms and offers to fill credentials
- **Password Generator**: Creates strong passwords with customizable options
- **Auto-Lock**: Vault automatically locks after inactivity
- **Dark Mode**: Support for light and dark themes
- **Open Source**: Full transparency about the codebase

## Project Structure

### Root Files

- **manifest.json**: Extension manifest file that defines metadata, permissions, and component registration
- **package.json**: NPM package configuration with dependencies and scripts
- **webpack.config.js**: Webpack configuration for bundling the extension
- **README.md**: This documentation file

### Source Directories

#### Crypto (`src/crypto/`)

- **crypto.js**: Core cryptography utilities using Web Crypto API
  - Implements PBKDF2 key derivation
  - Provides AES-256-GCM encryption and decryption
  - Includes salt generation and secure random bytes

#### Storage (`src/storage/`)

- **storage.js**: Data persistence layer using IndexedDB
  - Manages vault database for encrypted credentials
  - Handles settings storage
  - Provides CRUD operations for credentials and settings

#### Vault (`src/vault/`)

- **vault.js**: Core vault management logic
  - Initializes and unlocks the encrypted vault
  - Manages credential encryption/decryption
  - Handles vault locking and security checks

#### Popup (`src/popup/`)

- **popup.html**: Main extension popup UI structure
- **popup.js**: Popup functionality and interaction logic
- **popup.css**: Styles for the popup interface
- Provides interfaces for:
  - Vault unlocking
  - Credential viewing and management
  - Quick search and access

#### Options (`src/options/`)

- **options.html**: Settings page HTML structure
- **options.js**: Settings functionality and logic
- **options.css**: Styles for the options page
- Manages:
  - Security settings
  - Appearance preferences
  - Data management options

#### Content (`src/content/`)

- **content.js**: Content script that runs in web pages
  - Scans for login forms
  - Implements form field detection
  - Handles credential autofill
  - Communicates with background script

#### Background (`src/background/`)

- **background.js**: Service worker that runs in the background
  - Manages vault state (locked/unlocked)
  - Handles message passing between components
  - Implements auto-lock functionality
  - Provides context menu integration
  - Manages keyboard shortcuts

#### Generator (`src/generator/`)

- **generator.js**: Password generation utilities
  - Generates secure random passwords
  - Implements password strength evaluation
  - Creates passphrases and PIN codes
  - Uses Web Crypto API for randomness

- **password-settings.js**: Manages password generation preferences
  - Saves/loads user preferences
  - Provides default settings
  - Maps settings to generator options

- **generator.html**: UI for the password generator
  - Tabs for different generator types
  - Strength meter visualization
  - Advanced options section

- **generator.css**: Styles for the generator UI
  - Responsive design
  - Theme support
  - Visual feedback elements

- **generator-ui.js**: Generator interface logic
  - Handles user interactions
  - Manages tab switching
  - Implements copy/save functionality
  - Updates strength meter in real-time

## Security Model

1. **Master Password**: Never stored, only used to derive the encryption key
2. **Key Derivation**: PBKDF2 with 600,000+ iterations for slow brute-force resistance
3. **Encryption**: AES-256-GCM with unique IV for each credential
4. **Zero Knowledge**: All encryption/decryption happens locally
5. **Auto-Lock**: Vault automatically locks after inactivity period
6. **No Telemetry**: No data sent to remote servers

## Development Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the extension in your browser's developer mode

## Browser Compatibility

- Chrome/Chromium (version 88+)
- Edge (version 88+)
- Firefox (with Manifest V3 support)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
