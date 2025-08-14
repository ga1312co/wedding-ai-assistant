import axios from 'axios';

// In production (GCS), we REQUIRE VITE_BACKEND_URL to be set at build time.
// In development, we fall back to localhost if not provided.
const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

if (import.meta.env.PROD && !import.meta.env.VITE_BACKEND_URL) {
  // Helpful console message if someone forgot to set it during build
  // (Does not crash the app; API calls will fail visibly instead.)
  // eslint-disable-next-line no-console
  console.warn('VITE_BACKEND_URL is not set in production build. API calls will fail.');
}

export const login = async (password) => {
  const response = await axios.post(`${BASE_URL}/login`, { password });
  return response.data;
};

export const sendMessage = async (message, history, sessionId) => {
  const formattedHistory = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const maxAttempts = 3;
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      const response = await axios.post(`${BASE_URL}/chat`, { message, history: formattedHistory, sessionId });
      return response.data;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (attempt >= maxAttempts) break;
      // Exponential backoff: 300ms, 600ms
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastErr;
};
