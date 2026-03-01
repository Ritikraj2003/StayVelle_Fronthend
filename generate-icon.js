/**
 * Converts Logo.png to build/icon.ico for electron-builder
 */
const png2icons = require('png2icons');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src', 'assets', 'images', 'Logo.png');
const outputDir = path.join(__dirname, 'build');
const outputPath = path.join(outputDir, 'icon.ico');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const pngBuffer = fs.readFileSync(inputPath);
const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, true, true);

if (icoBuffer) {
    fs.writeFileSync(outputPath, icoBuffer);
    console.log('✅ Icon created at build/icon.ico');
} else {
    console.error('❌ Failed to create icon');
}
