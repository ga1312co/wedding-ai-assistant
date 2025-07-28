const genAI = require('../config/gemini');
const { getWeddingData } = require('./weddingDataService');

const chat = async (history, userMessage) => {
  const weddingData = getWeddingData();
  let context = "";
  for (const key in weddingData) {
    context += `${key.replace(/_/g, " ")}: ${weddingData[key]}.\n`;
  }

  // Create the full prompt with context and user message
  const fullPrompt = `You are a helpful AI assistant for a wedding. Your goal is to answer questions about the wedding using the information below. Primarily answer in Swedish. Keep your answers concise and to the point. 
If the user greets you or asks a general question, respond with a friendly greeting and invite them to ask about the wedding. 
If a question is outside the scope of wedding information, respond with: "Bara frågor om bröllopet, tack!" Never say that you need the wedding information or that it is missing; you always have all the wedding information you need below.

Wedding Information:
${context}

User Question: ${userMessage}

Please answer the question based on the wedding information provided above.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Use generateContent instead of chat for simpler interaction
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

module.exports = { chat };