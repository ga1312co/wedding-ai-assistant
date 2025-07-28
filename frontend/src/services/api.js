import axios from 'axios';

const BASE_URL =
  (window.appConfig && window.appConfig.backendUrl) ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3001';

export const login = async (password) => {
  const response = await axios.post(`${BASE_URL}/login`, { password });
  return response.data;
};

export const sendMessage = async (message, history) => {
  const formattedHistory = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
  const response = await axios.post(`${BASE_URL}/chat`, { message, history: formattedHistory });
  return response.data;
};
