const genAI = require('../config/gemini');
const { getWeddingPrompt } = require('../prompts/weddingPrompt');

const chatSessions = {};

const createSession = () => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
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
    rsvpPrompted: false,
    isAwaitingSleepResponse: false,
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

  // Check if we are waiting for the user's permission to sleep.
  if (entry.isAwaitingSleepResponse) {
    const affirmative = /ja|ok|visst|säkert|vila du/i.test(userMessage);
    entry.isAwaitingSleepResponse = false; // Reset flag immediately

    if (affirmative) {
      // If user agrees, respond with a sleep message.
      // Use the special "early" message if appropriate.
      if (entry.answers <= 3) {
        return "zzZZz... Glöm inte att OSA... zzzZZZZ...";
      } else {
        return "ZzzZzz...";
      }
    }
    // If user does not agree, we fall through and treat it as a normal message.
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await session.sendMessage(userMessage);
      const response = await result.response;
      let text = response.text();

      // Part 1: Handle RSVP state
      if (!entry.rsvpPrompted) {
        const rsvpRegex = /osa|rsvp|anmälan|anmäla/i;
        if (rsvpRegex.test(text)) {
          entry.rsvpPrompted = true;
        }
      }
      entry.answers++;

      if (entry.answers >= 3 && !entry.rsvpPrompted) {
        text += `\n\nPsst, glöm inte att OSA! Du gör det genom att klicka på den gröna knappen.`;
        entry.rsvpPrompted = true;
      }

      // Part 2: Handle Sleep state (blocked by RSVP)
      if (!entry.sleepPrompted && entry.rsvpPrompted && shouldPromptSleep(entry.answers, userMessage)) {
        entry.sleepPrompted = true;
        entry.isAwaitingSleepResponse = true; // Set the flag that we've asked
        
        text += `\n\nJag börjar bli lite trött... får jag ta en liten tupplur?`;
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
