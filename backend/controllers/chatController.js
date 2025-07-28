const chatService = require('../services/chatService');

const postChatMessage = async (req, res) => {
  try {
    const { history, message } = req.body;
    const sessionId = 'default_session'; 
    const text = await chatService.chat(sessionId, history, message);
    res.json({ text });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { postChatMessage };
