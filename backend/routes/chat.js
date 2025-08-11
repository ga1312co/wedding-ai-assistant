const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/chat', async (req, res) => {
  try {
    // Basic diagnostics for debugging (safe to log)
    console.log('Incoming /chat request body keys:', Object.keys(req.body || {}));
    console.log('Has GEMINI_API_KEY?', !!process.env.GEMINI_API_KEY);

    // Ensure we await the controller in case it's async
    await Promise.resolve(chatController.postChatMessage(req, res));
  } catch (err) {
    console.error('Error in /chat route:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: err?.message || 'Unknown error' });
    }
  }
});

module.exports = router;
