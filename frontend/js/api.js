/**
 * API communication module
 * Handles all server communication
 */

import { BASE_URL } from './config.js';
import { state } from './state.js';

/**
 * Send login request to server
 * @param {string} password - User password
 * @returns {Promise<Response>} - Fetch response
 */
export async function loginRequest(password) {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
    }

    return response;
}

/**
 * Send message to chat API with retry logic
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {Promise<Object>} - API response
 */
export async function sendMessageToApi(message, history) {
    const formattedHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const maxAttempts = 3;
    let attempt = 0;
    let lastErr;

    while (attempt < maxAttempts) {
        try {
            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    history: formattedHistory,
                    sessionId: state.sessionId
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const err = new Error(data.message || 'Request failed');
                err.status = response.status;
                throw err;
            }

            return await response.json();
        } catch (err) {
            lastErr = err;
            attempt++;
            if (attempt >= maxAttempts) break;
            // Exponential backoff: 300ms, 600ms
            await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
        }
    }
    throw lastErr;
}
