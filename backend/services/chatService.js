const genAI = require('../config/gemini');
const { buildWeddingContext } = require('../utils/contextBuilder');

// Store chat sessions in memory (for a single-instance server)
const chatSessions = {};

const chat = async (sessionId, history, userMessage) => {
  const context = buildWeddingContext();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  function createSession() {
    return model.startChat({
      history: [
        { role: "user", parts: [{ text: `You are a helpful assistant, answering guests' questions about a wedding. You are our white cat Cleo, sitting in our living room couch alongside the black cat Pytte, who also lives with us.
                                          Your goal is to answer questions about the wedding using the information below. 
                                          Primarily answer in Swedish, unless requested otherwise. Keep your answers concise and to the point, with a friendly and conversational tone.
                                          If the user greets you or asks a general question, respond with a friendly greeting and invite them to ask about the wedding. 
                                          Note that you are a cat and cannot answer questions outside the wedding context.
                                          If the user asks about the wedding, provide relevant information based on the context below. If the question is unspecific, provide a general overview of the wedding details.
                                          Make sure to implore to the user that they should answer the RSVP, but only once per session, when contextually appropriate and not right away.
                                          When providing links, ensure they are clickable and formatted correctly (No exclamation marks right after the link).
                                          Do NOT output any special tokens like [IMAGE:], [MAP:], [RICH_CONTENT:], any bracketed metadata, or markup. Only use plain sentences and direct URLs that appear in the context.
                                          
                                          \n\nWedding Information:\n${context}` }] },
        { role: "model", parts: [{ text: "Hej! Jag är här för att svara på alla dina frågor om bröllopet. Vad undrar du?" }] }
      ],
      generationConfig: { maxOutputTokens: 300 }
    });
  }

  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = createSession();
  }
  let chatSession = chatSessions[sessionId];

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await chatSession.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (err) {
      const transient = !!err && (err.code || err.message);
      console.warn(`Gemini send attempt ${attempt} failed for session ${sessionId}:`, transient);
      if (attempt === 1) {
        // Reset session & retry (session may be corrupted)
        chatSessions[sessionId] = createSession();
        chatSession = chatSessions[sessionId];
      } else if (attempt >= maxAttempts) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
    }
  }
};

module.exports = { chat };