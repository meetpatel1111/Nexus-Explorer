const fs = require('fs-extra');
const path = require('path');

console.log('Starting electron file copy process...');

// Ensure build directory exists
const buildDir = path.resolve(__dirname, '..', 'build');
const publicDir = path.join(buildDir, 'public');

console.log(`Build directory: ${buildDir}`);

// Create build and public directories if they don't exist
fs.ensureDirSync(buildDir);
fs.ensureDirSync(publicDir);

// Paths
const electronSrc = path.resolve(__dirname, '..', 'public', 'electron.js');
const electronDest = path.join(buildDir, 'electron.js');

console.log(`Source electron.js path: ${electronSrc}`);
console.log(`Destination electron.js path: ${electronDest}`);

// Ensure source file exists
if (!fs.existsSync(electronSrc)) {
  console.error(`Error: Source file not found at ${electronSrc}`);
  console.log('Current working directory:', process.cwd());
  console.log('Directory contents:', fs.readdirSync(path.dirname(electronSrc)));
  process.exit(1);
}

console.log(`Copying ${electronSrc} to ${electronDest}`);

try {
  // Copy electron.js to build directory
  fs.copyFileSync(electronSrc, electronDest);
  console.log('Successfully copied electron.js to build directory');

  // Create package.json in build directory
  console.log('Creating/updating package.json in build directory...');
  const packageJson = require('../package.json');
  
  const newPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description || 'Nexus Explorer',
    author: packageJson.author || 'Nexus Team',
    main: './electron.js',  // Ensure relative path
    dependencies: packageJson.dependencies || {}
  };

  const packageJsonPath = path.join(buildDir, 'package.json');
  
  console.log(`Writing package.json to ${packageJsonPath}`);
  fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
  
  console.log('Package.json contents:', JSON.stringify(newPackageJson, null, 2));
  
  // Copy all public files except electron.js
  console.log('Copying public files...');
  const publicSrc = path.resolve(__dirname, '..', 'public');
  
  fs.readdirSync(publicSrc)
    .filter(file => file !== 'electron.js')
    .forEach(file => {
      const src = path.join(publicSrc, file);
      const dest = path.join(publicDir, file);
      console.log(`Copying ${src} to ${dest}`);
      if (fs.lstatSync(src).isDirectory()) {
        fs.copySync(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    });
  
  console.log('Electron files prepared successfully!');
  console.log('Final build directory contents:');
  console.log(fs.readdirSync(buildDir));
  
} catch (error) {
  console.error('Error preparing Electron files:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
