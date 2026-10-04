# WEDDING AI ASSISTANT → WEDDING PHOTOS 🐈🐈‍⬛

### TO RUN: USE .ENV IN ROOT WITH:
- DRIVE_API_KEY:XXX (Google API key with the Drive API enabled)
- GEMINI_API_KEY:XXX (the chat with Cleo)
- GOOGLE_SHEET_URL:XXX (Apps Script web app that logs the chat to a Google Sheet)
- DRIVE_FOLDER_ID:XXX (optional, defaults to the public "BILDER BRÖLLOP B&G" folder)

**AND**
- Clone project 
- Docker compose / node index.js for backend 🐳
- `cd frontend && npm run dev` for frontend (or simply serve the frontend folder with any static file server) 🏃

### PHOTOS 📸
After the wedding the site became a photo viewer: guests log in with their last name, Cleo thanks them, Pytte asks if they want to see some pictures, and the camera turns around to a TV showing a slideshow. Back at the sofa the guest can chat with Cleo (Gemini) and leave a greeting; every message is logged to a Google Sheet with the guest's last name.
The backend lists the Drive folder (`GET /photos`, cached 5 min), so new photos dropped into the folder show up without a redeploy.

### FRONTEND
The frontend is a lightweight vanilla HTML/CSS/JS application (no React or build tools required for development).
- **Development**: `npm run dev` (uses `serve` to serve files locally)
- **Production build**: `npm run build` (copies files to `dist/` and injects backend URL from `VITE_BACKEND_URL` environment variable)

### DEPLOYMENT
#### BACKEND - GOOGLE CLOUD RUN ☁️☁️☁️
#### FRONTEND - FIREBASE 🔥🔥🔥
