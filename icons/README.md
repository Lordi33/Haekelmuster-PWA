# Icons für Häkelrechner PWA

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

```bash
npm install sharp
node convert-to-png.js
```

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
