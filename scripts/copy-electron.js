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
  // Copy electron.js to build directory
  fs.copyFileSync(electronSrc, electronDest);
  console.log('Successfully copied electron.js to build directory');

  // Create package.json in build directory
  console.log('Creating package.json in build directory...');
  const packageJson = require('../package.json');
  
  // Create minimal package.json for production
  const newPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || 'Nexus Explorer',
    author: packageJson.author || 'Nexus Team',
    main: 'electron.js',
    dependencies: packageJson.dependencies || {},
    build: {
      appId: (packageJson.build && packageJson.build.appId) || 'com.nexus.explorer',
      productName: (packageJson.build && packageJson.build.productName) || 'Nexus Explorer',
      files: [
        '**/*',
        '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
        '!**/*.o'
      ]
    }
  };

  const packageJsonPath = path.join(buildDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
  console.log(`Created package.json at ${packageJsonPath}`);
  
  console.log('Electron files prepared successfully!');
} catch (error) {
  console.error('Error preparing Electron files:', error);
  process.exit(1);
}
