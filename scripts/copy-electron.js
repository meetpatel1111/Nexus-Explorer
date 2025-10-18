const fs = require('fs-extra');
const path = require('path');

console.log('Starting electron file copy process...');

// Ensure build directory exists
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  console.error('Build directory not found. Run `npm run build` first.');
  process.exit(1);
}

// Paths
const electronSrc = path.join(__dirname, '../public/electron.js');
const electronDest = path.join(buildDir, 'electron.js');

// Ensure source file exists
if (!fs.existsSync(electronSrc)) {
  console.error(`Error: Source file not found at ${electronSrc}`);
  process.exit(1);
}

console.log(`Copying ${electronSrc} to ${electronDest}`);

try {
  // 1. Copy electron.js to build directory
  fs.copyFileSync(electronSrc, electronDest);
  console.log('Successfully copied electron.js to build directory');

  // 2. Create package.json in build directory
  console.log('Creating package.json in build directory...');
  const packageJson = require('../package.json');
  
  const newPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || 'Nexus Explorer',
    author: packageJson.author || 'Nexus Team',
    main: 'electron.js',
    dependencies: packageJson.dependencies || {}
  };

  const packageJsonPath = path.join(buildDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
  console.log(`Created package.json at ${packageJsonPath}`);

  // 3. Create a simple main.js in build directory
  const mainJsPath = path.join(buildDir, 'main.js');
  fs.writeFileSync(mainJsPath, `// Main process for Electron
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// When Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create a window when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});`);
  
  console.log('Created main.js in build directory');
  console.log('Electron files prepared successfully!');
} catch (error) {
  console.error('Error preparing Electron files:', error);
  process.exit(1);
}
