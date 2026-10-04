# WEDDING AI ASSISTANT → WEDDING PHOTOS 🐈🐈‍⬛

### TO RUN: USE .ENV IN ROOT WITH:
- DRIVE_API_KEY:XXX (Google API key with the Drive API enabled)
- DRIVE_FOLDER_ID:XXX (optional, defaults to the public "BILDER BRÖLLOP B&G" folder)

**AND**
- Clone project 
- Docker compose / node index.js for backend 🐳
- `cd frontend && npm run dev` for frontend (or simply serve the frontend folder with any static file server) 🏃

### PHOTOS 📸
After the wedding the site became a photo viewer: guests log in with their last name, Cleo asks if they want to see some pictures, and the camera turns around to a TV showing a slideshow.
The backend lists the Drive folder (`GET /photos`, cached 5 min), so new photos dropped into the folder show up without a redeploy.

### FRONTEND
The frontend is a lightweight vanilla HTML/CSS/JS application (no React or build tools required for development).
- **Development**: `npm run dev` (uses `serve` to serve files locally)
- **Production build**: `npm run build` (copies files to `dist/` and injects backend URL from `VITE_BACKEND_URL` environment variable)

### DEPLOYMENT
#### BACKEND - GOOGLE CLOUD RUN ☁️☁️☁️
#### FRONTEND - FIREBASE 🔥🔥🔥
