# Wedding AI Assistant Frontend

A lightweight vanilla HTML/CSS/JS frontend for the Wedding AI Assistant chatbot.

## Features
- No build tools required for development
- Single page application with login and chat views
- Typewriter text effect for bot messages
- Chat history modal
- RSVP modal with embedded Google Form
- Sleep mode for the cat character
- Responsive design for mobile and desktop

## Development

```bash
# Install dependencies (optional, for the serve package)
npm install

# Start development server
npm run dev
```

Or simply open `index.html` in your browser, though you'll need a backend running for the API calls.

## Production Build

```bash
# Set the backend URL environment variable
export VITE_BACKEND_URL=https://your-backend-url.com

# Build for production
npm run build
```

The build script will:
1. Copy all files to the `dist/` folder
2. Create a `config.js` file with the backend URL
3. Update `index.html` to include the config

## Files

- `index.html` - Main HTML structure
- `styles.css` - All CSS styles (consolidated from React components)
- `app.js` - All JavaScript functionality
- `build.js` - Simple build script for production
- `assets/` - Images (cat, sofa, etc.)
- `public/` - Favicon and other public files
