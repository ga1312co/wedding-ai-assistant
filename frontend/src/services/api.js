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
  const response = await axios.post(`${BASE_URL}/chat`, { message, history });
  return response.data;
};
