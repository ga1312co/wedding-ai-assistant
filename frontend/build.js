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

// Helper function to copy directory recursively
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Copy styles folder (CSS modules)
copyDirRecursive(path.join(srcDir, 'styles'), path.join(distDir, 'styles'));

// Copy js folder (JS modules)
copyDirRecursive(path.join(srcDir, 'js'), path.join(distDir, 'js'));

// Copy assets folder
copyDirRecursive(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));

// Copy public folder (favicon)
copyDirRecursive(path.join(srcDir, 'public'), path.join(distDir, 'public'));

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
