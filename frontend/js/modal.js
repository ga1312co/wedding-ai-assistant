/**
 * Modal handling module
 * Handles RSVP modal and chat history modal
 */

import { state, elements } from './state.js';
import { sanitizeAndLinkify } from './utils.js';

/**
 * Show chat history modal
 */
export function showChatHistory() {
    elements.historyMessages.innerHTML = '';
    
    state.messages.forEach(function(msg) {
        const div = document.createElement('div');
        div.className = 'history-message ' + msg.sender;
        
        const strong = document.createElement('strong');
        strong.textContent = msg.sender === 'user' ? 'You: ' : 'Cleo: ';
        
        div.appendChild(strong);
        
        const textSpan = document.createElement('span');
        textSpan.innerHTML = sanitizeAndLinkify(msg.text);
        div.appendChild(textSpan);
        
        elements.historyMessages.appendChild(div);
    });
    
    elements.chatHistoryModal.style.display = 'flex';
}

/**
 * Hide chat history modal
 */
export function hideChatHistory() {
    elements.chatHistoryModal.style.display = 'none';
}

/**
 * Show RSVP modal
 */
export function showRsvpModal() {
    elements.rsvpModal.style.display = 'flex';
}

/**
 * Hide RSVP modal
 */
export function hideRsvpModal() {
    elements.rsvpModal.style.display = 'none';
}

/**
 * Setup modal event listeners
 */
export function setupModalListeners() {
    // Expand button (chat history)
    elements.expandButton.addEventListener('click', function() {
        showChatHistory();
    });

    // Minimize chat history
    elements.minimizeHistory.addEventListener('click', function() {
        hideChatHistory();
    });

    // RSVP modal
    elements.rsvpButton.addEventListener('click', function() {
        showRsvpModal();
    });
    elements.rsvpClose.addEventListener('click', function() {
        hideRsvpModal();
    });
    elements.rsvpModal.addEventListener('click', function(e) {
        if (e.target === elements.rsvpModal) {
            hideRsvpModal();
        }
    });
}
