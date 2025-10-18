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
  
  // Read the existing package.json if it exists
  if (fs.existsSync(packageJsonPath)) {
    const existingPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    // Merge with existing package.json
    Object.assign(existingPackage, newPackageJson);
    fs.writeFileSync(packageJsonPath, JSON.stringify(existingPackage, null, 2));
  } else {
    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
  }
  
  console.log(`Updated package.json at ${packageJsonPath}`);
  
  // 3. Ensure the public directory exists in build
  const publicDir = path.join(buildDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // 4. Copy icon file if it exists
  const iconSrc = path.join(__dirname, '../public/icon.ico');
  if (fs.existsSync(iconSrc)) {
    const iconDest = path.join(publicDir, 'icon.ico');
    fs.copyFileSync(iconSrc, iconDest);
    console.log('Copied icon.ico to build directory');
  }
  
  console.log('Electron files prepared successfully!');
} catch (error) {
  console.error('Error preparing Electron files:', error);
  process.exit(1);
}
