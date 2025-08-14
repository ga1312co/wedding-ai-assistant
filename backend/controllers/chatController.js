const chatService = require('../services/chatService');

const postChatMessage = async (req, res) => {
  try {
    const { history, message, sessionId } = req.body;
    const sid = sessionId || 'anon_' + Date.now();
    let text = await chatService.chat(sid, history, message);
    if (req.rateLimit?.shouldWarn) {
      text += '\n\nNu har du ställt många frågor. Jag kan svara på 10 till - sen behöver jag sova.';
    }
    res.json({ text });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { postChatMessage };
