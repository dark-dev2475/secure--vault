# 🔐 Secure Shelf - Advanced Password Manager Extension

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dark-dev2475/secure--vault)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](manifest.json)

Secure Shelf is a cutting-edge browser extension that provides military-grade password management with complete client-side encryption. Every operation happens locally in your browser, ensuring zero-knowledge architecture where even the developers cannot access your data.

## ✨ Core Features

### 🔒 **Military-Grade Security**
- **AES-256-GCM Encryption**: Industry-standard encryption with authentication
- **PBKDF2 Key Derivation**: 600,000+ iterations for brute-force resistance
- **Zero-Knowledge Architecture**: All encryption/decryption happens locally
- **Salt-Based Protection**: Unique salt for each vault prevents rainbow table attacks
- **Secure Memory Handling**: Automatic memory cleanup after use

### 🤖 **Intelligent Auto-Fill**
- **Smart Form Detection**: Recognizes login forms across all websites
- **Multi-Type Support**: Handles traditional forms, SPAs, and AJAX-based logins
- **Context-Aware Matching**: Intelligent URL and domain matching
- **Manual Override**: Option to manually select credentials for any form
- **Real-Time Scanning**: Detects dynamically loaded forms

### 🎯 **Advanced Auto-Lock System**
- **Configurable Timeouts**: Set custom auto-lock periods (30s to 24hrs)
- **Activity Detection**: Monitors user activity across all tabs
- **Instant Lock**: Manual lock option for immediate security
- **Background Processing**: Service worker maintains lock state even when browser is idle
- **Visual Countdown**: Real-time timer display in popup interface

### 🔧 **Professional Password Generator**
- **Multiple Generation Types**: Passwords, passphrases, PINs, and custom patterns
- **Advanced Customization**: Length, character sets, and complexity rules
- **Real-Time Strength Analysis**: Visual strength meter with detailed feedback
- **Pronounceable Options**: Easy-to-remember but secure password generation
- **Bulk Generation**: Generate multiple passwords at once

### 🎨 **Modern User Interface**
- **Responsive Design**: Optimized for all screen sizes and browser windows
- **Dark/Light Themes**: Automatic theme detection with manual override
- **Intuitive Navigation**: Clean, accessible interface with keyboard shortcuts
- **Quick Search**: Instant credential filtering and search
- **Drag & Drop**: Easy credential organization and management

## 🏗️ Architecture & Project Structure

### 📁 **Root Configuration Files**

- **`manifest.json`**: Extension manifest defining permissions, background scripts, and browser integration
- **`package.json`**: NPM configuration with dependencies, build scripts, and project metadata
- **`webpack.config.js`**: Advanced webpack configuration for optimized bundling and development
- **`worker.js`**: Service worker for background processing and auto-lock functionality

### 🔐 **Core Security Layer (`src/crypto/`)**

#### `crypto.js` - Cryptographic Engine
- **Key Derivation**: PBKDF2 implementation with configurable iterations
- **Encryption/Decryption**: AES-256-GCM with unique IV generation
- **Secure Random Generation**: Web Crypto API integration for cryptographically secure randomness
- **Salt Management**: Automatic salt generation and validation
- **Memory Security**: Secure key handling with automatic cleanup

### 💾 **Storage Layer (`src/storage/`)**

#### `storage.js` - Data Persistence Manager
- **IndexedDB Integration**: Robust local database for encrypted credential storage
- **Atomic Operations**: Transaction-based operations for data consistency
- **Backup/Restore**: Export and import functionality for vault data
- **Migration Support**: Automatic schema updates and data migration
- **Quota Management**: Storage usage monitoring and optimization

### 🔒 **Vault Management (`src/vault/`)**

#### `vault.js` - Core Vault Logic
- **Vault Initialization**: New vault creation with master password setup
- **Unlock/Lock Operations**: Secure vault access control
- **Credential Management**: CRUD operations for stored credentials
- **Session Management**: Secure key storage during active sessions
- **Auto-Lock Integration**: Timeout-based automatic vault locking

### 🖼️ **User Interface Components**

#### **Popup Interface (`src/popup/`)**
- **`popup.html`**: Main extension interface structure
- **`popup.js`**: Interactive functionality and event handling
- **`popup.css`**: Modern styling with theme support
- **Features**:
  - Quick credential access and search
  - Vault unlock/lock controls
  - Auto-fill suggestions
  - Security status indicators

#### **Options Page (`src/options/`)**
- **`options.html`**: Comprehensive settings interface
- **`options.js`**: Configuration management and validation
- **`options.css`**: Advanced styling for complex forms
- **Settings Categories**:
  - Security preferences (auto-lock timing, encryption settings)
  - Appearance customization (themes, UI preferences)
  - Auto-fill behavior configuration
  - Data management (backup, import, reset)

#### **Password Generator (`src/generator/`)**
- **`generator.html`**: Multi-tab generator interface
- **`generator.js`**: Core password generation algorithms
- **`generator-ui.js`**: Interactive UI controls and real-time updates
- **`password-settings.js`**: User preference management
- **`generator.css`**: Responsive design with visual feedback
- **Generation Types**:
  - Secure passwords with customizable complexity
  - Memorable passphrases with word lists
  - Numeric PINs with pattern options
  - Custom patterns and character sets

### 🌐 **Web Integration (`src/content/`)**

#### `content.js` - Form Detection & Auto-Fill Engine
- **Smart Form Recognition**: Advanced DOM scanning for login forms
- **SPA Support**: Dynamic form detection for single-page applications
- **Secure Injection**: Safe credential insertion without exposing data
- **Context Matching**: Intelligent domain and URL-based credential matching
- **User Activity Monitoring**: Tracks interaction for auto-lock functionality

#### `injected.js` - Page Context Bridge
- **Isolated Execution**: Secure communication between content script and page
- **Event Handling**: Captures form submissions and field changes
- **DOM Manipulation**: Safe form field interaction and modification

### ⚙️ **Background Processing (`src/background/`)**

#### `background.js` - Service Worker Core
- **Message Routing**: Secure communication between all extension components
- **State Management**: Persistent vault state across browser sessions
- **Auto-Lock Enforcement**: Timer-based automatic vault locking
- **Context Menu Integration**: Right-click menu options for quick access
- **Keyboard Shortcuts**: Global hotkey support for common actions

## 🛡️ Security Architecture

### 🔐 **Multi-Layer Security Model**

1. **Master Password Protection**
   - Never stored in any form (memory or disk)
   - Used only for key derivation during vault unlock
   - Automatic memory clearing after use
   - Strong password requirements with real-time validation

2. **Advanced Key Derivation (PBKDF2)**
   - Minimum 600,000 iterations (adjustable for future-proofing)
   - Unique salt per vault (prevents rainbow table attacks)
   - SHA-256 hash function for maximum security
   - Configurable iteration count based on device performance

3. **Military-Grade Encryption (AES-256-GCM)**
   - Authenticated encryption with automatic integrity verification
   - Unique Initialization Vector (IV) for each credential
   - Galois/Counter Mode for both confidentiality and authenticity
   - Protection against padding oracle and timing attacks

4. **Zero-Knowledge Architecture**
   - All cryptographic operations performed locally
   - No data transmission to external servers
   - Browser-based encryption using Web Crypto API
   - Secure random number generation from system entropy

5. **Advanced Auto-Lock System**
   - Configurable timeout periods (30 seconds to 24 hours)
   - Cross-tab activity monitoring
   - Service worker-based timer management
   - Immediate lock on browser close or system sleep
   - Visual countdown and warning notifications

6. **Memory Security**
   - Automatic key material cleanup
   - Secure string handling for sensitive data
   - Protection against memory dump attacks
   - Minimal sensitive data exposure time

### 🚨 **Threat Model Protection**

- **Malware Protection**: Local encryption prevents data theft even with system compromise
- **Network Attacks**: No network communication means no man-in-the-middle vulnerabilities
- **Physical Access**: Auto-lock and strong encryption protect against device theft
- **Browser Exploits**: Isolated execution context and minimal permissions
- **Social Engineering**: Strong authentication and user education

## 🚀 **Advanced Functionality Guide**

### 🎯 **Auto-Fill Intelligence**

#### **Smart Form Detection**
- **Traditional Forms**: Standard HTML form elements
- **Modern SPAs**: React, Angular, Vue.js applications
- **Dynamic Content**: AJAX-loaded and progressive web apps
- **Custom Implementations**: Non-standard login interfaces

#### **Matching Algorithm**
- **Exact Domain Matching**: Precise URL-based credential selection
- **Subdomain Intelligence**: Automatic matching for related domains
- **Port-Aware Matching**: Development environments with custom ports
- **Protocol Handling**: HTTP/HTTPS automatic correlation

#### **Security Features**
- **Secure Injection**: Credentials inserted without exposure to page scripts
- **Timing Protection**: Random delays to prevent timing analysis
- **Visual Confirmation**: User confirmation for sensitive operations
- **Blacklist Support**: Excluded domains and form types

### ⏰ **Auto-Lock System**

#### **Timer Management**
- **Precision Timing**: Millisecond-accurate countdown system
- **Background Processing**: Service worker maintains timer state
- **Activity Detection**: Mouse, keyboard, and focus event monitoring
- **Cross-Tab Synchronization**: Shared lock state across all browser tabs

#### **User Experience**
- **Visual Countdown**: Real-time timer display in popup
- **Warning Notifications**: Advance warning before auto-lock
- **Quick Extend**: One-click timer extension option
- **Manual Lock**: Instant lock button for immediate security

#### **Configuration Options**
- **Flexible Timeouts**: Range from 30 seconds to 24 hours
- **Activity-Based Reset**: Timer reset on user interaction
- **Custom Warnings**: Configurable warning timing
- **Emergency Lock**: Panic button for instant security

### 🔧 **Password Generation System**

#### **Generation Algorithms**
- **Cryptographically Secure**: Web Crypto API random number generation
- **Pattern-Based**: Customizable character sets and patterns
- **Dictionary-Based**: Secure passphrase generation with word lists
- **Hybrid Approaches**: Combination of multiple generation methods

#### **Strength Analysis**
- **Real-Time Evaluation**: Instant feedback on password strength
- **Multiple Metrics**: Length, entropy, character diversity, pattern analysis
- **Visual Feedback**: Color-coded strength indicators
- **Improvement Suggestions**: Specific recommendations for stronger passwords

#### **Customization Options**
- **Length Control**: Adjustable password length (4-128 characters)
- **Character Sets**: Custom inclusion/exclusion of character types
- **Pattern Rules**: Complex pattern specifications
- **Exclusion Lists**: Avoid confusing or problematic characters

## 🔄 **Data Management & Backup**

### 💾 **Storage Architecture**
- **IndexedDB Backend**: Robust, asynchronous local database
- **Encrypted Storage**: All data encrypted before storage
- **Atomic Operations**: Transaction-based consistency guarantees
- **Automatic Cleanup**: Orphaned data removal and optimization

### 🔄 **Backup & Restore**
- **Encrypted Exports**: Vault data export with maintained encryption
- **Selective Backup**: Choose specific credentials or full vault
- **Cross-Device Sync**: Manual export/import between devices
- **Recovery Options**: Multiple restore points and recovery mechanisms

### 🧹 **Data Hygiene**
- **Automatic Cleanup**: Remove unused or expired credentials
- **Duplicate Detection**: Identify and merge duplicate entries
- **Usage Analytics**: Track credential usage for optimization
- **Privacy Protection**: No tracking or analytics data collection

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 16+ (LTS recommended)
- npm 8+ or yarn 1.22+
- Git for version control
- Modern browser with Manifest V3 support

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/dark-dev2475/secure--vault.git
cd secure--vault

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

### **Development Scripts**
- `npm run dev` - Development build with file watching
- `npm run build` - Production build with optimization
- `npm run package` - Create distribution package
- `npm run test` - Run test suite
- `npm run lint` - Code quality checks

## 🌐 **Browser Compatibility**

### **Fully Supported**
- **Chrome/Chromium**: Version 88+ (Manifest V3 support)
- **Microsoft Edge**: Version 88+ (Chromium-based)
- **Brave Browser**: Latest versions
- **Opera**: Version 74+ (Chromium-based)

### **Planned Support**
- **Firefox**: Manifest V3 compatibility (in development)
- **Safari**: WebExtensions API support

### **Technical Requirements**
- **Web Crypto API**: For cryptographic operations
- **IndexedDB**: For local storage
- **Service Workers**: For background processing
- **Content Scripts**: For page interaction

## 📊 **Performance & Optimization**

### **Resource Usage**
- **Memory Footprint**: < 10MB typical usage
- **CPU Impact**: Minimal background processing
- **Storage Efficiency**: Compressed and encrypted data
- **Network Usage**: Zero (completely offline)

### **Optimization Features**
- **Lazy Loading**: Components loaded on demand
- **Webpack Bundling**: Optimized code splitting
- **Caching Strategy**: Efficient resource caching
- **Minification**: Production code optimization

## 🔐 **Security Compliance**

### **Standards & Certifications**
- **OWASP Guidelines**: Following security best practices
- **Web Crypto API**: Standard-compliant cryptography
- **CSP Headers**: Content Security Policy implementation
- **Secure Coding**: Regular security audits and reviews

### **Privacy Commitments**
- **No Data Collection**: Zero telemetry or analytics
- **Local-Only Processing**: No cloud dependencies
- **Open Source**: Full code transparency
- **Regular Audits**: Community-driven security reviews

## 🤝 **Contributing**

### **Development Guidelines**
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for changes
- Submit pull requests with detailed descriptions

### **Bug Reports**
- Use GitHub issues for bug reports
- Include browser version and extension version
- Provide detailed reproduction steps
- Attach relevant console logs

### **Feature Requests**
- Discuss major features in GitHub discussions
- Consider security implications
- Provide use cases and benefits
- Follow the project roadmap

## 📄 **License & Legal**

**MIT License** - See [LICENSE](LICENSE) file for full details

This project is open source and free to use, modify, and distribute under the MIT license terms.

## 🆘 **Support & Documentation**

- **Documentation**: See [RUNNING.md](RUNNING.md) for detailed setup instructions
- **Issues**: Report bugs and request features on GitHub
- **Security**: Report security issues privately to the maintainers
- **Community**: Join discussions and get help from other users

---

**Built with ❤️ for privacy and security**
