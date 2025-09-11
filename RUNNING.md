# 🚀 Running Secure Shelf Password Manager Extension

This comprehensive guide covers everything you need to know about building, installing, configuring, and using the Secure Shelf password manager extension for development and production use.

## 📋 **Prerequisites & System Requirements**

### **Required Software**
- **Node.js**: Version 16.0.0 or higher (LTS recommended)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm**: Version 8.0.0 or higher (usually included with Node.js)
  - Verify installation: `npm --version`
- **Git**: For version control and cloning the repository
  - Download from [git-scm.com](https://git-scm.com/)

### **Supported Browsers**
- **Google Chrome**: Version 88+ (Recommended for development)
- **Microsoft Edge**: Version 88+ (Chromium-based)
- **Brave Browser**: Latest stable version
- **Opera**: Version 74+ (Chromium-based)

### **System Requirements**
- **RAM**: Minimum 4GB (8GB recommended for development)
- **Storage**: At least 500MB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)

## 🏗️ **Building the Extension**

### **1. Project Setup**

```bash
# Clone the repository
git clone https://github.com/dark-dev2475/secure--vault.git
cd secure--vault

# Install all dependencies
npm install
```

### **2. Development Build**

For active development with automatic rebuilding:

```bash
# Start development mode with file watching
npm run dev
```

**Development Features:**
- 🔄 **Hot Reload**: Automatic rebuilding on file changes
- 🐛 **Source Maps**: Detailed debugging information
- 📊 **Verbose Logging**: Enhanced console output for debugging
- ⚡ **Fast Builds**: Optimized for development speed

### **3. Production Build**

For final distribution:

```bash
# Create optimized production build
npm run build
```

**Production Optimizations:**
- 🗜️ **Minification**: Compressed JavaScript and CSS
- 📦 **Bundle Optimization**: Webpack optimization techniques
- 🚀 **Performance**: Optimized for runtime performance
- 🔒 **Security**: Hardened build configuration

### **4. Package for Distribution**

Create a ZIP file ready for browser store submission:

```bash
# Build and package extension
npm run package
```

This creates a `secure-shelf-extension.zip` file in the `dist/` directory.

## 🔧 **Installing the Extension in Browsers**

### **Google Chrome / Microsoft Edge**

#### **Step 1: Access Extension Management**
- **Chrome**: Navigate to `chrome://extensions/`
- **Edge**: Navigate to `edge://extensions/`
- Or use the menu: Settings → Extensions

#### **Step 2: Enable Developer Mode**
- Toggle the **"Developer mode"** switch in the top-right corner
- This enables installation of unpacked extensions

#### **Step 3: Load the Extension**
1. Click the **"Load unpacked"** button
2. Navigate to your project directory
3. Select the **`dist/`** folder (created by the build process)
4. Click **"Select Folder"** or **"Open"**

#### **Step 4: Verify Installation**
- The extension should appear in your extensions list
- Look for the Secure Shelf icon with a green "Enabled" status
- Check that all permissions are properly granted

#### **Step 5: Pin the Extension (Recommended)**
1. Click the extensions icon (puzzle piece) in the browser toolbar
2. Find "Secure Shelf" in the dropdown
3. Click the pin icon 📌 to keep it visible in the toolbar

### **Brave Browser**

Follow the same steps as Chrome:
1. Navigate to `brave://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` folder

### **Opera**

1. Navigate to `opera://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` folder

## 📖 **Complete User Guide**

### **🔐 Initial Setup & Vault Creation**

#### **First Launch**
1. **Click the Extension Icon**: Look for the Secure Shelf icon in your browser toolbar
2. **Create New Vault**: Choose "Create New Vault" on the welcome screen
3. **Set Master Password**: 
   - Must be at least 12 characters
   - Include uppercase, lowercase, numbers, and symbols
   - Avoid common words or personal information
   - This password is NEVER stored and cannot be recovered
4. **Confirm Setup**: Re-enter your master password to confirm
5. **Security Notice**: Read and acknowledge the security information

#### **Master Password Best Practices**
- **Length**: Use 15+ characters for maximum security
- **Complexity**: Mix character types and avoid patterns
- **Uniqueness**: Never reuse this password elsewhere
- **Memory**: Use a memorable phrase with modifications
- **Backup**: Consider secure offline backup methods

### **💳 Managing Credentials**

#### **Adding New Credentials**
1. **Open Extension**: Click the Secure Shelf icon
2. **Add Credential**: Click the "+" or "Add New" button
3. **Fill Details**:
   - **Website URL**: Full URL (https://example.com)
   - **Username/Email**: Your login identifier
   - **Password**: Use generator or enter manually
   - **Title**: Custom name for easy identification
   - **Notes**: Optional additional information
4. **Save**: Click "Save" to encrypt and store

#### **Using the Password Generator**
1. **Access Generator**: Click "Generate Password" when adding/editing credentials
2. **Choose Type**:
   - **Password**: Traditional character-based passwords
   - **Passphrase**: Word-based memorable passwords
   - **PIN**: Numeric-only passwords
3. **Customize Settings**:
   - **Length**: Adjust slider or enter specific length
   - **Character Types**: Toggle uppercase, lowercase, numbers, symbols
   - **Exclude Similar**: Avoid confusing characters (0, O, l, 1)
   - **Word Count**: For passphrases, set number of words
4. **Check Strength**: Monitor the real-time strength meter
5. **Generate**: Click "Generate" for new password
6. **Use Password**: Click "Use This Password" to apply

#### **Editing Existing Credentials**
1. **Find Credential**: Use search or browse the list
2. **Edit Mode**: Click the edit icon (pencil) or credential name
3. **Modify Fields**: Update any information as needed
4. **Password Updates**: Use generator for new passwords
5. **Save Changes**: Click "Save" to update the encrypted data

#### **Organizing Credentials**
- **Search Function**: Use the search bar for quick filtering
- **Sorting Options**: Sort by name, date added, or last used
- **Categories**: Group related credentials with custom tags
- **Favorites**: Mark frequently used credentials as favorites

### **🤖 Auto-Fill Functionality**

#### **Automatic Form Detection**
1. **Visit Login Page**: Navigate to any website with a login form
2. **Form Recognition**: Extension automatically detects login fields
3. **Credential Suggestion**: Available credentials appear as suggestions
4. **Quick Fill**: Click on a suggestion to auto-fill the form

#### **Manual Auto-Fill**
1. **Right-Click Method**: Right-click on any input field
2. **Context Menu**: Select "Secure Shelf" from the context menu
3. **Choose Credential**: Pick the appropriate credential from the list
4. **Fill Fields**: Selected credential will be inserted

#### **Keyboard Shortcuts**
- **Ctrl+Shift+A** (Windows/Linux) or **Cmd+Shift+A** (Mac): Quick auto-fill
- **Ctrl+Shift+G** (Windows/Linux) or **Cmd+Shift+G** (Mac): Open generator
- **Ctrl+Shift+L** (Windows/Linux) or **Cmd+Shift+L** (Mac): Lock vault

#### **Smart Matching Features**
- **Domain Matching**: Automatically matches credentials to websites
- **Subdomain Support**: Works with subdomains (mail.google.com, drive.google.com)
- **Port Handling**: Supports development environments with custom ports
- **Protocol Flexibility**: Works with both HTTP and HTTPS

### **⏰ Auto-Lock Configuration**

#### **Setting Auto-Lock Timer**
1. **Access Settings**: Click the gear icon in the extension popup
2. **Security Section**: Navigate to the Security settings
3. **Auto-Lock Timer**: Choose from preset options or set custom time:
   - **30 seconds**: Maximum security
   - **1 minute**: Quick access with security
   - **5 minutes**: Balanced approach
   - **15 minutes**: Convenient for active use
   - **1 hour**: Long work sessions
   - **4 hours**: Full workday
   - **Never**: Manual lock only (not recommended)

#### **Auto-Lock Behavior**
- **Activity Detection**: Timer resets on mouse movement, keyboard input, or tab switching
- **Cross-Tab Synchronization**: Lock state shared across all browser tabs
- **Visual Countdown**: Timer display in popup shows remaining time
- **Warning Notifications**: 30-second warning before auto-lock
- **Manual Lock**: Instant lock button available at any time

#### **Activity Monitoring**
- **Mouse Movement**: Detects cursor movement across web pages
- **Keyboard Input**: Monitors typing in any tab
- **Tab Switching**: Resets timer when changing tabs
- **Window Focus**: Tracks browser window activation
- **Form Interaction**: Detects interaction with input fields

### **🎨 Customization & Settings**

#### **Theme & Appearance**
1. **Access Options**: Right-click extension icon → "Options" or click gear icon in popup
2. **Theme Selection**:
   - **Auto**: Follow system theme preference
   - **Light**: Clean, bright interface
   - **Dark**: Easy on the eyes, battery-friendly
3. **UI Preferences**:
   - **Compact Mode**: Smaller interface for limited screen space
   - **Large Text**: Enhanced readability
   - **Animation**: Enable/disable UI animations

#### **Security Preferences**
- **Auto-Lock Timing**: Customize timeout periods
- **Password Requirements**: Set minimum complexity rules
- **Clipboard Timeout**: Auto-clear copied passwords (10-60 seconds)
- **Form Detection**: Enable/disable automatic form scanning
- **Secure Notes**: Enable encrypted note storage

#### **Backup & Data Management**
1. **Export Vault**:
   - Click "Export" in options page
   - Choose export format (encrypted JSON recommended)
   - Save to secure location
2. **Import Data**:
   - Click "Import" and select backup file
   - Verify data integrity
   - Merge or replace existing data
3. **Clear Data**:
   - Nuclear option: completely reset vault
   - Requires master password confirmation
   - Cannot be undone

## 🔧 **Development Workflow**

### **📝 Making Code Changes**

#### **Development Environment Setup**
```bash
# Start development mode
npm run dev

# In a separate terminal, start test server (if needed)
npm run test:server
```

#### **File Structure for Development**
- **Source Files**: Edit files in `src/` directory
- **Build Output**: Compiled files appear in `dist/` directory
- **Hot Reload**: Changes automatically trigger rebuilds
- **Source Maps**: Enable debugging with original source files

#### **Testing Changes**
1. **Make Changes**: Edit source files in your preferred editor
2. **Auto-Build**: Development mode automatically rebuilds
3. **Refresh Extension**: 
   - Go to browser extensions page
   - Find Secure Shelf extension
   - Click the refresh/reload icon (circular arrow)
4. **Test Functionality**: Verify changes work as expected

### **🐛 Debugging & Development Tools**

#### **Browser Developer Tools**
1. **Popup Debugging**:
   - Right-click extension icon → "Inspect popup"
   - Debug popup interface and JavaScript
2. **Background Script Debugging**:
   - Go to `chrome://extensions/`
   - Find Secure Shelf → Click "Service worker"
   - Debug background processes and auto-lock functionality
3. **Content Script Debugging**:
   - Open any webpage
   - F12 → Console tab
   - Look for Secure Shelf logs and errors

#### **Debugging Features**
- **Console Logging**: Extensive logging for troubleshooting
- **Error Handling**: Detailed error messages and stack traces
- **Performance Monitoring**: Built-in performance metrics
- **State Inspection**: Real-time vault and extension state

#### **Development Console Commands**
```javascript
// Check vault status
console.log('Vault Status:', await chrome.runtime.sendMessage({type: 'getVaultStatus'}));

// Test auto-lock timer
chrome.runtime.sendMessage({type: 'testAutoLock', duration: 10000});

// Debug form detection
window.secureShelfDebug = true;
```

### **📊 Performance Monitoring**

#### **Memory Usage**
- **Monitor Extension Memory**: Check browser task manager
- **Optimal Range**: < 10MB normal usage
- **Memory Leaks**: Watch for gradual memory increases

#### **CPU Usage**
- **Background Processing**: Minimal CPU usage expected
- **Auto-Lock Timer**: Lightweight timer implementation
- **Form Scanning**: Efficient DOM scanning algorithms

## 🚨 **Troubleshooting Guide**

### **🔍 Common Issues & Solutions**

#### **Extension Not Loading**
**Symptoms**: Extension doesn't appear in browser toolbar
**Solutions**:
1. Check browser compatibility (Chrome 88+, Edge 88+)
2. Verify `dist/` folder exists and contains built files
3. Run `npm run build` to rebuild extension
4. Ensure Developer Mode is enabled in browser
5. Check browser console for manifest errors

#### **Build Failures**
**Symptoms**: `npm run build` command fails
**Solutions**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (requires 16+)
node --version

# Update npm to latest version
npm install -g npm@latest

# Clear npm cache
npm cache clean --force
```

#### **Auto-Fill Not Working**
**Symptoms**: Credentials not suggested on login forms
**Solutions**:
1. **Check Permissions**: Ensure extension has access to the website
2. **Reload Page**: Refresh the webpage after extension installation
3. **Form Detection**: Check if form uses standard HTML input elements
4. **Manual Mode**: Use right-click context menu as fallback
5. **Domain Matching**: Verify saved URL matches current website

#### **Auto-Lock Issues**
**Symptoms**: Vault locks too early or doesn't lock
**Solutions**:
1. **Check Settings**: Verify auto-lock timer configuration
2. **Activity Detection**: Ensure browser tab is active
3. **Background Script**: Check service worker status in extensions page
4. **Manual Testing**: Use test commands in developer console
5. **Browser Restart**: Restart browser to reset service worker

#### **Password Generation Problems**
**Symptoms**: Generator produces weak or invalid passwords
**Solutions**:
1. **Check Settings**: Verify character set selections
2. **Length Requirements**: Ensure minimum length meets site requirements
3. **Special Characters**: Some sites restrict certain symbols
4. **Browser Support**: Ensure Web Crypto API is available
5. **Reset Settings**: Clear generator preferences and use defaults

#### **Performance Issues**
**Symptoms**: Extension runs slowly or causes browser lag
**Solutions**:
1. **Memory Check**: Monitor extension memory usage
2. **Disable Debug Mode**: Turn off development logging
3. **Clear Cache**: Clear browser cache and extension data
4. **Update Browser**: Ensure latest browser version
5. **Conflict Check**: Disable other password managers temporarily

### **🔧 Advanced Troubleshooting**

#### **Extension Debugging Commands**
```bash
# Check extension console logs
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Service worker" link for Secure Shelf
# 4. Check console for errors

# Reload extension completely
chrome.runtime.reload();

# Check extension permissions
chrome.permissions.getAll().then(console.log);

# Test message passing
chrome.runtime.sendMessage({type: 'ping'});
```

#### **Manual Reset Procedures**
1. **Soft Reset**: Clear extension storage only
   ```javascript
   chrome.storage.local.clear();
   chrome.storage.sync.clear();
   ```

2. **Hard Reset**: Remove and reinstall extension
   - Remove extension from browser
   - Delete `dist/` folder
   - Run `npm run build`
   - Reinstall extension

3. **Development Reset**: Clear all development data
   ```bash
   rm -rf dist/ node_modules/ package-lock.json
   npm install
   npm run build
   ```

### **📞 Getting Additional Help**

#### **Log Collection for Support**
1. **Browser Console Logs**:
   - F12 → Console tab
   - Copy any error messages
2. **Extension Console Logs**:
   - Extensions page → Service worker → Console
   - Copy background script errors
3. **System Information**:
   - Browser version and OS
   - Extension version
   - Reproduction steps

#### **Community Support**
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Get help from community members
- **Documentation**: Check README.md for additional information
- **Security Issues**: Report privately to maintainers

## 📦 **Distribution & Deployment**

### **Creating Production Builds**
```bash
# Create optimized production build
npm run build

# Package for browser stores
npm run package

# Verify package contents
unzip -l dist/secure-shelf-extension.zip
```

### **Store Submission Checklist**
- [ ] Production build completed successfully
- [ ] All features tested thoroughly
- [ ] Privacy policy updated
- [ ] Screenshots and descriptions prepared
- [ ] Version number updated in manifest.json
- [ ] Package size under store limits
- [ ] Security review completed

### **Version Management**
```bash
# Update version number
npm version patch   # Bug fixes
npm version minor   # New features
npm version major   # Breaking changes

# Tag releases
git tag -a v1.0.1 -m "Version 1.0.1 release"
git push origin --tags
```

---

**🎉 Congratulations! You're now ready to build, run, and customize Secure Shelf Password Manager.**

For additional help or to report issues, visit our [GitHub repository](https://github.com/dark-dev2475/secure--vault).
