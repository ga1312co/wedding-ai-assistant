const chatService = require('../services/chatService');
const { logToGoogleSheet } = require('../services/loggingService');

const postChatMessage = async (req, res, next) => {
  try {
    const { history, message, sessionId } = req.body;
    const sid = sessionId || 'anon_' + Date.now();
    // Sent by the client from the login response; only used to label the log
    const guestName = typeof req.body.guestName === 'string'
      ? req.body.guestName.trim().slice(0, 100)
      : '';
    let text = await chatService.chat(sid, history, message);
    if (req.rateLimit?.shouldWarn) {
      text += '\n\nNu har du ställt många frågor. Jag kan svara på 10 till - sen behöver jag sova.';
    }
    
    // Log to Google Sheet asynchronously (non-blocking)
    logToGoogleSheet(sid, message, text, guestName).catch(() => {
      // Already logged inside the function, no action needed here
    });
    
    res.json({ text });
  } catch (error) {
    next(error);
  }
};

module.exports = { postChatMessage };
