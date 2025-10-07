const genAI = require('../config/gemini');
const { getWeddingPrompt } = require('../prompts/weddingPrompt');

const chatSessions = {};

const createSession = () => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const prompt = getWeddingPrompt();

  return {
    session: model.startChat({
      history: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "model", parts: [{ text: "Hej! Jag är här för att svara på alla dina frågor om bröllopet. Vad undrar du?" }] },
      ],
      generationConfig: { maxOutputTokens: 300 },
    }),
    answers: 0,
    sleepPrompted: false,
  };
};

const getOrCreateSession = (sessionId) => {
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = createSession();
  }
  return chatSessions[sessionId];
};

const shouldPromptSleep = (answers, userMessage) => {
  if (answers < 2) return false;

  const userLower = userMessage.toLowerCase();
  const userRequestedSleep = /sov|tupplur|somna|sova/.test(userLower);
  const userRSVPIntent = /osa|rsvp|anmäln|länk|formulär/.test(userLower);

  if (userRequestedSleep || userRSVPIntent) return false;

  if (answers >= 4) return true;
  if (answers >= 2 && Math.random() < 0.4) return true;

  return false;
};

const chat = async (sessionId, history, userMessage) => {
  const entry = getOrCreateSession(sessionId);
  const { session } = entry;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await session.sendMessage(userMessage);
      const response = await result.response;
      let text = response.text();

      entry.answers++;

      if (!entry.sleepPrompted && shouldPromptSleep(entry.answers, userMessage)) {
        entry.sleepPrompted = true;
        text += '\n\nJag börjar bli lite trött... får jag ta en liten tupplur?';
      }

      return text;
    } catch (err) {
      console.warn(`Gemini send attempt ${attempt} failed for session ${sessionId}:`, err?.message || err);
      if (attempt >= maxAttempts) {
        throw err;
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
    }
  }
};

module.exports = { chat };
