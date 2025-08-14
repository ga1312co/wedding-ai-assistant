// Environment loading (repo root then backend)
const fs = require('fs');
const path = require('path');
(function loadEnv() {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env')
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p, override: false });
    }
  }
})();
(function validateEnv() {
  const required = ['LOGIN_PASSWORD', 'GEMINI_API_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.warn('Startup warning: missing env vars:', missing.join(', '));
  }
})();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const requestLogger = require('./middleware/requestLogger');

const app = express();
app.set('trust proxy', true); // so req.ip works correctly behind proxies (Cloud Run / load balancers)
const port = process.env.PORT || 3001;

// CORS: support multiple origins via comma-separated env CORS_ORIGIN
// Example: CORS_ORIGIN="https://storage.googleapis.com/wedding-frontend-bucket,https://wedding-frontend-bucket.storage.googleapis.com,https://example.com"
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsConfig = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header) and wildcard
    if (!origin || allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsConfig));
app.use(express.json());
app.use(requestLogger);

// Generic OPTIONS responder (avoids problematic wildcard patterns in Express 5)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/', authRoutes);
app.use('/', chatRoutes);

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.get('/', (_req, res) => {
  res.send('Hello from the Wedding AI Assistant backend!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});