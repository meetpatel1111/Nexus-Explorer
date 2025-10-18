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
  // Create main directory structure
  const appDir = path.join(buildDir, 'app');
  fs.ensureDirSync(appDir);
  
  // Copy electron.js to the root of the build directory
  fs.copyFileSync(electronSrc, path.join(buildDir, 'electron.js'));
  
  // Create package.json in the app directory
  const packageJson = require('../package.json');
  
  const newPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || 'Nexus Explorer',
    author: packageJson.author || 'Nexus Team',
    main: '../electron.js',
    dependencies: packageJson.dependencies || {}
  };

  const packageJsonPath = path.join(appDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
  
  // Move all build files to the app directory
  fs.readdirSync(buildDir).forEach(file => {
    if (file !== 'app' && file !== 'electron.js') {
      const srcPath = path.join(buildDir, file);
      const destPath = path.join(appDir, file);
      
      if (fs.lstatSync(srcPath).isDirectory()) {
        fs.moveSync(srcPath, destPath, { overwrite: true });
      } else if (file !== 'package.json') {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
  
  console.log('Successfully prepared Electron application structure');
  console.log('Electron files prepared successfully!');
} catch (error) {
  console.error('Error preparing Electron files:', error);
  process.exit(1);
}
