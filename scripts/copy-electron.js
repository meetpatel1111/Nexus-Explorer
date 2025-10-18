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

console.log(`Copying ${electronSrc} to ${electronDest}`);

// Copy electron.js to build directory
fs.copyFileSync(electronSrc, electronDest);

// Create package.json in build directory
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

// Create a simple index.js in build directory
const indexJsPath = path.join(buildDir, 'index.js');
fs.writeFileSync(indexJsPath, `// This file is required for electron-builder
require('./electron.js');`);

console.log('Electron files prepared successfully!');
