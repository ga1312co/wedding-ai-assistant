/**
 * Login functionality module
 * Handles user authentication
 */

import { state, elements } from './state.js';
import { loginRequest } from './api.js';
import { showBotMessage } from './chat.js';

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
export async function handleLogin(e) {
    e.preventDefault();
    elements.errorMessage.style.display = 'none';
    
    const password = elements.passwordInput.value;
    
    try {
        await loginRequest(password);

        // Login successful - show chat
        elements.loginContainer.style.display = 'none';
        elements.chatContainer.style.display = 'flex';
        
        // Show initial welcome message
        const welcomeMessage = 'Hej! Jag är Cleo. Fråga mig vad du vill om bröllopet. Du skriver ditt meddelande i rutan nedanför.';
        state.messages.push({ text: welcomeMessage, sender: 'model' });
        showBotMessage(welcomeMessage);
        
    } catch (err) {
        console.error('Login error:', err);
        elements.errorMessage.textContent = err.message || 'Failed to connect to the server.';
        elements.errorMessage.style.display = 'block';
    }
}
