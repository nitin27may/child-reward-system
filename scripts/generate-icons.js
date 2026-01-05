const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icon
const createSvg = (size) => {
  const radius = Math.round(size * 0.21);
  const starOuter = Math.round(size * 0.28);
  const starInner = Math.round(size * 0.11);
  const center = size / 2;
  
  // Generate star path
  let starPath = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? starOuter : starInner;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    starPath += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  starPath += 'Z';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)"/>
  <path d="${starPath}" fill="#ffffff"/>
</svg>`;
};

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('\nDone! Icons saved to public/icons/');
}

generateIcons();
