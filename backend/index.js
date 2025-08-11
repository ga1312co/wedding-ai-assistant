if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch {}
}
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(requestLogger);

app.use('/', authRoutes);
app.use('/', chatRoutes);

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.get('/', (req, res) => {
  res.send('Hello from the Wedding AI Assistant backend!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});