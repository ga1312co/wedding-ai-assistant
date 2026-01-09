/**
 * Simple build script for the vanilla HTML/CSS/JS frontend
 * Copies files to dist/ and injects the backend URL configuration
 */
const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');

// Get backend URL from environment or use default
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Create dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy static files
const filesToCopy = ['index.html', 'styles.css', 'app.js'];
filesToCopy.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    fs.writeFileSync(path.join(distDir, file), content);
});

// Copy assets folder
const assetsDir = path.join(srcDir, 'assets');
const distAssetsDir = path.join(distDir, 'assets');
fs.mkdirSync(distAssetsDir, { recursive: true });

if (fs.existsSync(assetsDir)) {
    fs.readdirSync(assetsDir).forEach(file => {
        fs.copyFileSync(path.join(assetsDir, file), path.join(distAssetsDir, file));
    });
}

// Copy public folder (favicon)
const publicDir = path.join(srcDir, 'public');
const distPublicDir = path.join(distDir, 'public');
fs.mkdirSync(distPublicDir, { recursive: true });

if (fs.existsSync(publicDir)) {
    fs.readdirSync(publicDir).forEach(file => {
        fs.copyFileSync(path.join(publicDir, file), path.join(distPublicDir, file));
    });
}

// Create config.js with backend URL
const configContent = `window.appConfig = { backendUrl: "${backendUrl}" };`;
fs.writeFileSync(path.join(distDir, 'config.js'), configContent);

// Update index.html to include config.js
let indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
indexHtml = indexHtml.replace(
    '<link rel="stylesheet" href="styles.css" />',
    '<link rel="stylesheet" href="styles.css" />\n    <script src="config.js"></script>'
);
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

console.log('Build complete!');
console.log('Backend URL:', backendUrl);
console.log('Output directory:', distDir);
