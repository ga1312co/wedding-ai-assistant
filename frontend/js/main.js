/**
 * Main application entry point
 * Initializes the application and sets up event listeners
 */

import { state, elements, initializeElements, generateSessionId } from './state.js';
import { typewriterEffect } from './utils.js';
import { handleLogin } from './login.js';
import { handleSendMessage } from './chat.js';
import { setupModalListeners } from './modal.js';

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Login form
    elements.loginForm.addEventListener('submit', handleLogin);

    // Chat input
    elements.chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    elements.sendButton.addEventListener('click', handleSendMessage);

    // Modal listeners
    setupModalListeners();
}

/**
 * Initialize the application
 */
function init() {
    state.sessionId = generateSessionId();
    
    // Get DOM elements
    initializeElements();

    // Set up event listeners
    setupEventListeners();

    // Start login page typewriter effect
    typewriterEffect(elements.typewriterTitle, 'Beata och Gabriels bröllop', 100);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
