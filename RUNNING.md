# Running Secure Shelf Browser Extension

This guide explains how to build and run the Secure Shelf password manager browser extension for development and testing purposes.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (usually comes with Node.js)
- A supported browser (Chrome, Edge, or Firefox with Manifest V3 support)

## Building the Extension

1. **Install Dependencies**

   Open a terminal or command prompt in the project root directory and run:

   ```bash
   npm install
   ```

   This will install all the required dependencies defined in `package.json`.

2. **Build the Extension**

   Run the build script:

   ```bash
   npm run build
   ```

   This will use webpack to bundle the extension files into the `dist/` directory.

   For development with auto-reloading:

   ```bash
   npm run dev
   ```

## Loading the Extension in Chrome/Edge

1. **Open the Extension Management page**
   - Chrome: Navigate to `chrome://extensions`
   - Edge: Navigate to `edge://extensions`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click the "Load unpacked" button
   - Navigate to the project's `dist/` directory and select it
   - The extension should now appear in your extensions list

4. **Pin the Extension (Optional)**
   - Click on the extensions icon in the browser toolbar
   - Find Secure Shelf and click the pin icon to keep it visible


## Using the Extension

1. **Setup**
   - Click on the Secure Shelf icon in your browser toolbar
   - Create a new vault by setting a master password
   - The vault will be created and you'll be taken to the main interface

2. **Adding Credentials**
   - Click the "+" button to add new credentials
   - Enter the website URL, username, and password
   - Click "Save" to encrypt and store the credentials

3. **Using Auto-Fill**
   - Visit a website with a login form
   - The extension will detect the form and offer to fill it with saved credentials
   - Click on the suggested credentials to auto-fill

4. **Generating Passwords**
   - When creating or updating credentials, click "Generate Password"
   - Customize the password settings as needed
   - Click "Use Password" to apply it to the form

5. **Accessing Options**
   - Right-click the extension icon and select "Options"
   - Or click the gear icon in the extension popup
   - Here you can modify security settings, appearance, and data management options

## Development Workflow

1. **Making Changes**
   - Edit the source files in the `src/` directory
   - If using `npm run dev`, changes will be automatically rebuilt
   - Otherwise, run `npm run build` after making changes

2. **Refreshing the Extension**
   - After rebuilding, go to the extensions page
   - Find Secure Shelf and click the refresh icon
   - In Chrome/Edge, this is a circular arrow icon
   - In Firefox, click "Reload" on the extension's debug page

3. **Debugging**
   - Right-click the extension icon and select "Inspect popup" to debug the popup
   - Use the browser's developer tools to inspect background and content scripts
   - Check the console for error messages and debugging information

## Troubleshooting

- **Extension not working after changes**: Make sure you've rebuilt the extension and refreshed it in the browser.
- **Popup not opening**: Check the console for errors by right-clicking the extension icon and selecting "Inspect popup".
- **Auto-fill not working**: Ensure the content script has permission for the website you're trying to use it on.
- **Build errors**: Make sure all dependencies are installed with `npm install` and that you're using a compatible Node.js version.

## Packaging for Distribution

To create a ZIP file for submission to browser extension stores:

```bash
npm run package
```

This will create a ZIP file in the `dist/` directory that can be submitted to browser extension stores.
