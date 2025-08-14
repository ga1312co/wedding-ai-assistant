const chatService = require('../services/chatService');

const postChatMessage = async (req, res, next) => {
  try {
    const { history, message, sessionId } = req.body;
    const sid = sessionId || 'anon_' + Date.now();
    let text = await chatService.chat(sid, history, message);
    if (req.rateLimit?.shouldWarn) {
      text += '\n\nNu har du ställt många frågor. Jag kan svara på 10 till - sen behöver jag sova.';
    }
    res.json({ text });
  } catch (error) {
    next(error);
  }
};

module.exports = { postChatMessage };
