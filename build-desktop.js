/**
 * Helper script to build the Stayvelle Desktop app.
 * 1. Generates build/icon.ico from Logo.png
 * 2. Builds Angular project with correct base-href
 * 3. Packages with electron-builder for Windows
 *
 * Usage: node build-desktop.js
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Set the electron-builder cache directory
process.env.ELECTRON_BUILDER_CACHE = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'electron-builder',
    'Cache'
);

// Disable code signing (unsigned installer)
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

// ─── Step 1: Generate icon ───────────────────────────────────────────────────
console.log('🎨 Generating app icon from Logo.png...');
const png2icons = require('png2icons');
const pngBuffer = fs.readFileSync(path.join(__dirname, 'src', 'assets', 'images', 'Logo.png'));
const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, true, true);
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
console.log('✅ build/icon.ico ready');

// ─── Step 2: Build Angular ───────────────────────────────────────────────────
console.log('\n🔨 Building Angular project...');
execSync('ng build --base-href ./', { stdio: 'inherit' });

// ─── Step 3: Package with electron-builder ───────────────────────────────────
console.log('\n📦 Packaging with electron-builder...');
execSync('npx electron-builder --win', { stdio: 'inherit' });

console.log('\n✅ Build complete! Check release/ folder for the installer.');
