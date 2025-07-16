const fs = require('fs');
const path = require('path');

// Einfache Icon-Generierung mit SVG zu PNG (ohne externe Dependencies)
// Dieses Script erstellt SVG-Icons und kann später mit Tools wie Sharp erweitert werden

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// SVG Template für das Häkel-Icon
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Hintergrund -->
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  
  <!-- Häkelnadel -->
  <rect x="200" y="50" width="20" height="350" rx="10" fill="#e5e7eb"/>
  <rect x="195" y="45" width="30" height="30" rx="15" fill="#9ca3af"/>
  <rect x="190" y="380" width="40" height="40" rx="20" fill="#6b7280"/>
  
  <!-- Garn/Wolle -->
  <circle cx="350" cy="150" r="80" fill="url(#grad2)"/>
  <circle cx="350" cy="150" r="60" fill="#f3f4f6"/>
  <circle cx="350" cy="150" r="40" fill="url(#grad2)"/>
  
  <!-- Häkelarbeit/Muster -->
  <path d="M 100 300 Q 150 250 200 300 Q 250 350 300 300 Q 350 250 400 300 Q 450 350 500 300" 
        stroke="#f59e0b" stroke-width="8" fill="none"/>
  <path d="M 100 350 Q 150 300 200 350 Q 250 400 300 350 Q 350 300 400 350 Q 450 400 500 350" 
        stroke="#f59e0b" stroke-width="8" fill="none"/>
  <path d="M 100 400 Q 150 350 200 400 Q 250 450 300 400 Q 350 350 400 400 Q 450 450 500 400" 
        stroke="#f59e0b" stroke-width="8" fill="none"/>
  
  <!-- Maschen-Symbole -->
  <text x="120" y="480" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white">🧶</text>
  <text x="200" y="480" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white">+</text>
  <text x="250" y="480" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white">|</text>
  <text x="300" y="480" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white">o</text>
  
  <!-- App-Name -->
  <text x="50" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">Häkel</text>
  <text x="380" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">Rechner</text>
</svg>
`;

// Einfache SVG-Icon-Erstellung
function generateSVGIcons() {
  const iconsDir = path.join(__dirname, '.');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  sizes.forEach(size => {
    const svg = svgTemplate(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`Generated ${filename}`);
  });
}

// Favicon ICO generieren (vereinfacht)
function generateFavicon() {
  const faviconSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#3b82f6"/>
  <text x="16" y="22" font-family="Arial" font-size="20" font-weight="bold" fill="white" text-anchor="middle">🧶</text>
</svg>
  `;
  
  fs.writeFileSync(path.join(__dirname, 'favicon.svg'), faviconSvg);
  console.log('Generated favicon.svg');
}

// Splash Screen SVGs generieren
function generateSplashScreens() {
  const splashSizes = [
    { width: 640, height: 1136, name: 'splash-640x1136' },
    { width: 750, height: 1334, name: 'splash-750x1334' },
    { width: 1242, height: 2208, name: 'splash-1242x2208' },
    { width: 1125, height: 2436, name: 'splash-1125x2436' }
  ];

  splashSizes.forEach(splash => {
    const splashSvg = `
<svg width="${splash.width}" height="${splash.height}" viewBox="0 0 ${splash.width} ${splash.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fdf2f8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f3e8ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${splash.width}" height="${splash.height}" fill="url(#bg)"/>
  
  <!-- App Icon -->
  <g transform="translate(${splash.width/2 - 64}, ${splash.height/2 - 100})">
    <rect width="128" height="128" rx="20" fill="#3b82f6"/>
    <text x="64" y="90" font-family="Arial" font-size="60" font-weight="bold" fill="white" text-anchor="middle">🧶</text>
  </g>
  
  <!-- App Name -->
  <text x="${splash.width/2}" y="${splash.height/2 + 60}" font-family="Arial" font-size="32" font-weight="bold" fill="#1f2937" text-anchor="middle">Profi-Häkelrechner</text>
  
  <!-- Loading Indicator -->
  <g transform="translate(${splash.width/2 - 15}, ${splash.height/2 + 100})">
    <circle cx="15" cy="15" r="12" stroke="#3b82f6" stroke-width="3" fill="none" stroke-dasharray="75" stroke-dashoffset="75">
      <animate attributeName="stroke-dashoffset" values="75;0" dur="1s" repeatCount="indefinite"/>
    </circle>
  </g>
</svg>
    `;
    
    fs.writeFileSync(path.join(__dirname, '..', 'assets', `${splash.name}.svg`), splashSvg);
    console.log(`Generated ${splash.name}.svg`);
  });
}

// README für Icon-Generierung
function generateReadme() {
  const readme = `# Icons für Häkelrechner PWA

## Generierte Icons

Diese Icons wurden automatisch generiert für die PWA:

### App Icons
- icon-16x16.svg - Browser Tab
- icon-32x32.svg - Browser Tab (Retina)
- icon-72x72.svg - Android Chrome
- icon-96x96.svg - Android Chrome
- icon-128x128.svg - Chrome Web Store
- icon-144x144.svg - Windows Metro
- icon-152x152.svg - iPad
- icon-180x180.svg - iPhone
- icon-192x192.svg - Android Chrome (Standard)
- icon-384x384.svg - Android Chrome (Retina)
- icon-512x512.svg - Android Chrome (High-DPI)

### Favicon
- favicon.svg - Moderne Browser

### Splash Screens
- splash-640x1136.svg - iPhone 5/SE
- splash-750x1334.svg - iPhone 6/7/8
- splash-1242x2208.svg - iPhone 6+/7+/8+
- splash-1125x2436.svg - iPhone X/XS

## PNG-Konvertierung

Um SVG zu PNG zu konvertieren, verwenden Sie:

\`\`\`bash
npm install sharp
node convert-to-png.js
\`\`\`

## Maskable Icons

Für bessere Android-Integration können maskable Icons erstellt werden:
- Verwenden Sie einen weißen Hintergrund
- Stellen Sie sicher, dass wichtige Elemente im "safe area" (80% des Icons) sind
- Testen Sie mit dem Maskable.app Tool

## Farben

- Primary: #3b82f6 (Blau)
- Secondary: #10b981 (Grün)
- Accent: #f59e0b (Orange)
- Background: #fdf2f8 → #f3e8ff (Gradient)

## Verwendung

Diese Icons werden automatisch in der manifest.json referenziert und von der PWA verwendet.
`;

  fs.writeFileSync(path.join(__dirname, 'README.md'), readme);
  console.log('Generated README.md');
}

// Assets-Verzeichnis erstellen
function createAssetsDir() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
}

// Hauptfunktion
function main() {
  console.log('Generating PWA icons...');
  
  createAssetsDir();
  generateSVGIcons();
  generateFavicon();
  generateSplashScreens();
  generateReadme();
  
  console.log('✅ All icons generated successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Install Sharp: npm install sharp');
  console.log('2. Convert SVG to PNG: node convert-to-png.js');
  console.log('3. Test icons with Lighthouse PWA audit');
}

// Script ausführen
if (require.main === module) {
  main();
}

module.exports = {
  generateSVGIcons,
  generateFavicon,
  generateSplashScreens,
  generateReadme
};
