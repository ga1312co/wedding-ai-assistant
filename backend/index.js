require('dotenv').config();
console.log('Backend starting with LOGIN_PASSWORD:', process.env.LOGIN_PASSWORD); // Debugging .env loading
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const requestLogger = require('./middleware/requestLogger'); // Import requestLogger

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger); // Use the requestLogger middleware

app.use('/', authRoutes);
app.use('/', chatRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the Wedding AI Assistant backend!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});