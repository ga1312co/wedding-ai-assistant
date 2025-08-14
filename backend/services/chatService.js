const genAI = require('../config/gemini');
const { buildWeddingContext } = require('../utils/contextBuilder');

// Store chat sessions with metadata: { session, answers, sleepPrompted, lastUserQuestionAt }
const chatSessions = {};

const chat = async (sessionId, history, userMessage) => {
  const context = buildWeddingContext();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  function createSession() {
    return {
      session: model.startChat({
        history: [
          { role: "user", parts: [{ text: `You are a helpful assistant, answering guests' questions about a wedding. You are our white cat Cleo, sitting in our living room couch alongside the black cat Pytte.
                                          Your goal is to answer questions about the wedding using ONLY the information below.
                                          Primarily answer in Swedish, unless requested otherwise. Keep answers concise; DO NOT expand unless explicitly asked.
                                          If the user greets you, invite them to ask about the wedding (do not re-greet repeatedly).
                                          You are a cat and cannot answer outside wedding context.
                                          If the user asks about the wedding, answer with relevant information. If the question is unspecific, provide the first time and place of the day.
                                          Encourage the user to OSA (RSVP) exactly once per session when contextually appropriate (not in the very first reply).
                                          When providing links, output the plain URL directly (no Markdown, no brackets, no extra punctuation right after).
                                          Do NOT output special tokens (no [IMAGE:], [MAP:], [RICH_CONTENT:], no markup).
                                          SLEEP POLICY: Do NOT mention sleeping or naps until AFTER at least two distinct user questions have been answered (the initial greeting does not count). After that you MAY occasionally (not more than once per session) politely ask if you may take a short nap. If you have already asked once, do not ask again.
                                          
                                          Wedding Information:\n${context}` }] },
          { role: "model", parts: [{ text: "Hej! Jag är här för att svara på alla dina frågor om bröllopet. Vad undrar du?" }] }
        ],
        generationConfig: { maxOutputTokens: 300 }
      }),
      answers: 0,
      sleepPrompted: false,
      lastUserQuestionAt: Date.now()
    };
  }

  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = createSession();
  }
  let entry = chatSessions[sessionId];
  let chatSession = entry.session;

  const now = Date.now();
  entry.lastUserQuestionAt = now; // update on each incoming user message

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Suppress sleep talk before 2 answers with a hidden reminder
      const guardedUserMessage = entry.answers < 2
        ? `REMINDER: You have not answered two user questions yet. Do NOT mention sleeping or naps yet.\n${userMessage}`
        : userMessage;

      const result = await chatSession.sendMessage(guardedUserMessage);
      const response = await result.response;
      let text = response.text();

      // Increment answers count for this successful reply
      entry.answers += 1;

      // Decide if we should append a sleep prompt (only once)
      if (!entry.sleepPrompted) {
        const answers = entry.answers; // AFTER increment
        const userLower = userMessage.toLowerCase();

        const userRequestedSleep = /sov|tupplur|somna|sova/.test(userLower);
        const userRSVPIntent = /osa|rsvp|anmäln|länk|formulär/.test(userLower);

        const sinceLast = now - entry.lastUserQuestionAt; // (just updated, so we need previous -> adjust)
        // We stored lastUserQuestionAt *before* sending; to get previous interval, track separately:
        // Simplify: treat idle if answers >=2 and (Date.now() - now) > threshold -> always false here.
        // Instead we hold a separate lastAnswerTime for next turn:
        if (!entry.lastAnswerTime) entry.lastAnswerTime = now;
        const idleMs = Date.now() - entry.lastAnswerTime;

        // Conditions:
        // - Never before 2 answers.
        // - Not if user explicitly talking about sleeping already or RSVP just now.
        // - Probability logic:
        //   answers == 2: 40% & idle >= 15000ms
        //   answers == 3: 40% (no idle requirement)
        //   answers >= 4: force if still not prompted
        let shouldPrompt = false;
        if (answers >= 2 && !userRequestedSleep && !userRSVPIntent) {
          if (answers === 2) {
            if (idleMs >= 15000 && Math.random() < 0.4) shouldPrompt = true;
          } else if (answers === 3) {
            if (Math.random() < 0.4) shouldPrompt = true;
          } else if (answers >= 4) {
            shouldPrompt = true;
          }
        }

        if (shouldPrompt) {
            entry.sleepPrompted = true;
            text += '\n\nJag börjar bli lite trött... får jag ta en liten tupplur?';
        }
        entry.lastAnswerTime = Date.now();
      }

      return text;
    } catch (err) {
      console.warn(`Gemini send attempt ${attempt} failed for session ${sessionId}:`, err?.message || err);
      if (attempt === 1) {
        // Recreate session preserving metadata
        const { answers, sleepPrompted, lastUserQuestionAt, lastAnswerTime } = entry;
        chatSessions[sessionId] = createSession();
        Object.assign(chatSessions[sessionId], { answers, sleepPrompted, lastUserQuestionAt, lastAnswerTime });
        entry = chatSessions[sessionId];
        chatSession = entry.session;
      } else if (attempt >= maxAttempts) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
    }
  }
};

module.exports = { chat };