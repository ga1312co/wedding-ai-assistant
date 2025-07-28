const genAI = require('../config/gemini');
const { buildWeddingContext } = require('../utils/contextBuilder');

// Store chat sessions in memory (for a single-instance server)
const chatSessions = {};

const chat = async (sessionId, history, userMessage) => {
  const context = buildWeddingContext();

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Get or create a chat session
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = model.startChat({
      history: [
        { role: "user", parts: [{ text: `You are a helpful assistant, answering guests' questions about a wedding. You are our white cat Cleo, sitting in our living room couch alongside the black cat Pytte, who also lives with us.
                                          Your goal is to answer questions about the wedding using the information below. 
                                          Primarily answer in Swedish. Keep your answers concise and to the point, with a friendly and conversaitonal tone.
                                          If the user greets you or asks a general question, respond with a friendly greeting and invite them to ask about the wedding. 
                                          If a question is outside the scope of wedding information, respond with: "Bara frågor om bröllopet, tack!".
                                          If the user asks about the wedding, provide relevant information based on the context below. If the question is unspecific, provide a general overview of the wedding details.
                                          
                                          \n\nWedding Information:\n${context}` }] },
        { role: "model", parts: [{ text: "Hej! Jag är här för att svara på alla dina frågor om bröllopet. Vad undrar du?" }] }
      ],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });
  }

  const chatSession = chatSessions[sessionId];

  // Send the user's message to the chat session
  const result = await chatSession.sendMessage(userMessage);
  const response = await result.response;
  const text = response.text();
  return text;
};

module.exports = { chat };