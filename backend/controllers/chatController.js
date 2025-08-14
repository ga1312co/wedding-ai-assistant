const chatService = require('../services/chatService');

const postChatMessage = async (req, res) => {
  try {
    const { history, message, sessionId } = req.body;
    const sid = sessionId || 'anon_' + Date.now();
    const text = await chatService.chat(sid, history, message);
    res.json({ text });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { postChatMessage };
