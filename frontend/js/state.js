/**
 * State management module
 * Centralized state for the application
 */

// Application state
export const state = {
    messages: [],
    sessionId: null,
    isSleeping: false,
    rateLimitReached: false,
    sleepRequested: false,
    lastUserMessage: null,
    isTyping: false,
    currentTypewriterTimeout: null
};

// DOM element references (initialized after DOM loads)
export const elements = {
    loginContainer: null,
    chatContainer: null,
    loginForm: null,
    passwordInput: null,
    errorMessage: null,
    typewriterTitle: null,
    aiBubble: null,
    aiBubbleContent: null,
    userBubble: null,
    userBubbleContent: null,
    chatInput: null,
    sendButton: null,
    expandButton: null,
    rsvpButton: null,
    rsvpModal: null,
    rsvpClose: null,
    chatHistoryModal: null,
    minimizeHistory: null,
    historyMessages: null,
    cleoImage: null
};

/**
 * Initialize DOM element references
 */
export function initializeElements() {
    elements.loginContainer = document.getElementById('login-container');
    elements.chatContainer = document.getElementById('chat-container');
    elements.loginForm = document.getElementById('login-form');
    elements.passwordInput = document.getElementById('password');
    elements.errorMessage = document.getElementById('error-message');
    elements.typewriterTitle = document.getElementById('typewriter-title');
    elements.aiBubble = document.getElementById('ai-bubble');
    elements.aiBubbleContent = document.getElementById('ai-bubble-content');
    elements.userBubble = document.getElementById('user-bubble');
    elements.userBubbleContent = document.getElementById('user-bubble-content');
    elements.chatInput = document.getElementById('chat-input');
    elements.sendButton = document.getElementById('send-button');
    elements.expandButton = document.getElementById('expand-button');
    elements.rsvpButton = document.getElementById('rsvp-button');
    elements.rsvpModal = document.getElementById('rsvp-modal');
    elements.rsvpClose = document.getElementById('rsvp-close');
    elements.chatHistoryModal = document.getElementById('chat-history-modal');
    elements.minimizeHistory = document.getElementById('minimize-history');
    elements.historyMessages = document.getElementById('history-messages');
    elements.cleoImage = document.getElementById('cleo-image');
}

/**
 * Generate a unique session ID
 */
export function generateSessionId() {
    return 'sess_' + Math.random().toString(16).slice(2) + Date.now().toString(36);
}
