// Wedding AI Assistant - Vanilla JavaScript
(function() {
    'use strict';

    // Configuration
    // In production, we use the environment-injected config or fall back to localhost for dev
    const BASE_URL = window.appConfig?.backendUrl || 'http://localhost:3001';
    
    // State
    let messages = [];
    let sessionId = null;
    let isSleeping = false;
    let rateLimitReached = false;
    let sleepRequested = false;
    let lastUserMessage = null;
    let isTyping = false;
    let currentTypewriterTimeout = null;

    // DOM Elements (will be initialized after DOM loads)
    let loginContainer, chatContainer, loginForm, passwordInput, errorMessage;
    let typewriterTitle, aiBubble, aiBubbleContent, userBubble, userBubbleContent;
    let chatInput, sendButton, expandButton, rsvpButton, rsvpModal, rsvpClose;
    let chatHistoryModal, minimizeHistory, historyMessages, cleoImage;

    // Initialize session ID (persists during tab session using sessionStorage)
    function getOrCreateSessionId() {
        let storedSessionId = sessionStorage.getItem('weddingAssistantSessionId');
        if (!storedSessionId) {
            storedSessionId = 'sess_' + Math.random().toString(16).slice(2) + Date.now().toString(36);
            sessionStorage.setItem('weddingAssistantSessionId', storedSessionId);
        }
        return storedSessionId;
    }

    // Initialize the app
    function init() {
        sessionId = getOrCreateSessionId();
        
        // Get DOM elements
        loginContainer = document.getElementById('login-container');
        chatContainer = document.getElementById('chat-container');
        loginForm = document.getElementById('login-form');
        passwordInput = document.getElementById('password');
        errorMessage = document.getElementById('error-message');
        typewriterTitle = document.getElementById('typewriter-title');
        aiBubble = document.getElementById('ai-bubble');
        aiBubbleContent = document.getElementById('ai-bubble-content');
        userBubble = document.getElementById('user-bubble');
        userBubbleContent = document.getElementById('user-bubble-content');
        chatInput = document.getElementById('chat-input');
        sendButton = document.getElementById('send-button');
        expandButton = document.getElementById('expand-button');
        rsvpButton = document.getElementById('rsvp-button');
        rsvpModal = document.getElementById('rsvp-modal');
        rsvpClose = document.getElementById('rsvp-close');
        chatHistoryModal = document.getElementById('chat-history-modal');
        minimizeHistory = document.getElementById('minimize-history');
        historyMessages = document.getElementById('history-messages');
        cleoImage = document.getElementById('cleo-image');

        // Set up event listeners
        setupEventListeners();

        // Start login page typewriter effect
        typewriterEffect(typewriterTitle, 'Beata och Gabriels bröllop', 100);
    }

    function setupEventListeners() {
        // Login form
        loginForm.addEventListener('submit', handleLogin);

        // Chat input
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
        sendButton.addEventListener('click', handleSendMessage);

        // Expand button (chat history)
        expandButton.addEventListener('click', function() {
            showChatHistory();
        });

        // Minimize chat history
        minimizeHistory.addEventListener('click', function() {
            hideChatHistory();
        });

        // RSVP modal
        rsvpButton.addEventListener('click', function() {
            rsvpModal.style.display = 'flex';
        });
        rsvpClose.addEventListener('click', function() {
            rsvpModal.style.display = 'none';
        });
        rsvpModal.addEventListener('click', function(e) {
            if (e.target === rsvpModal) {
                rsvpModal.style.display = 'none';
            }
        });
    }

    // Typewriter effect
    function typewriterEffect(element, text, delay, onComplete) {
        let index = 0;
        element.textContent = '';
        
        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                currentTypewriterTimeout = setTimeout(type, delay);
            } else if (onComplete) {
                onComplete();
            }
        }
        type();
    }

    // Cancel any ongoing typewriter effect
    function cancelTypewriter() {
        if (currentTypewriterTimeout) {
            clearTimeout(currentTypewriterTimeout);
            currentTypewriterTimeout = null;
        }
    }

    // Login handler
    async function handleLogin(e) {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        const password = passwordInput.value;
        
        try {
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

            // Login successful - show chat
            loginContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
            
            // Show initial welcome message
            const welcomeMessage = 'Hej! Jag är Cleo. Fråga mig vad du vill om bröllopet. Du skriver ditt meddelande i rutan nedanför.';
            messages.push({ text: welcomeMessage, sender: 'model' });
            showBotMessage(welcomeMessage);
            
        } catch (err) {
            console.error('Login error:', err);
            errorMessage.textContent = err.message || 'Failed to connect to the server.';
            errorMessage.style.display = 'block';
        }
    }

    // Show bot message with typewriter effect
    function showBotMessage(text) {
        aiBubble.classList.add('visible');
        aiBubble.classList.remove('fade-out');
        isTyping = true;
        
        typewriterEffect(aiBubbleContent, text, 50, function() {
            isTyping = false;
        });
    }

    // Update Cleo image based on sleeping state
    function updateCleoImage() {
        if (isSleeping) {
            cleoImage.src = 'assets/cleosleeping.png';
            cleoImage.className = 'cleo-image cleo-sleeping-image';
        } else {
            cleoImage.src = 'assets/cleo.png';
            cleoImage.className = 'cleo-image';
        }
    }

    // Send message handler
    async function handleSendMessage() {
        const input = chatInput.value.trim();
        if (input === '') return;

        const raw = input.toLowerCase();

        // If bot previously asked to sleep and user answers affirmatively
        if (sleepRequested && !isSleeping && !rateLimitReached) {
            const affirmativeTokenRegex = /\b(ja|japp|ok|okej|okay|yes|sure|absolut|gärna|visst|kör|gör det|låter bra|ta en tupplur|ta tupplur|sov)\b/i;
            const negativeRegex = /\b(nej|inte|ej|vill inte|no|nope)\b/i;
            
            if (affirmativeTokenRegex.test(raw) && !negativeRegex.test(raw)) {
                sleepRequested = false;
                isSleeping = true;
                updateCleoImage();
                
                messages.push({ text: input, sender: 'user' });
                const systemMsg = 'Zzz...';
                messages.push({ text: systemMsg, sender: 'model' });
                
                lastUserMessage = input;
                showUserBubble(input);
                showBotMessage(systemMsg);
                chatInput.value = '';
                return;
            } else {
                sleepRequested = false;
            }
        }

        // Manual sleep command
        if (raw === 'sov' && !isSleeping && !rateLimitReached) {
            sleepRequested = false;
            isSleeping = true;
            updateCleoImage();
            
            messages.push({ text: input, sender: 'user' });
            const systemMsg = 'Zzz...';
            messages.push({ text: systemMsg, sender: 'model' });
            
            lastUserMessage = input;
            showUserBubble(input);
            showBotMessage(systemMsg);
            chatInput.value = '';
            return;
        }

        // Wake up if sleeping
        if (isSleeping && !rateLimitReached) {
            isSleeping = false;
            updateCleoImage();
        }

        // Add user message
        messages.push({ text: input, sender: 'user' });
        lastUserMessage = input;
        showUserBubble(input);
        chatInput.value = '';

        // Hide AI bubble while waiting
        aiBubble.classList.add('fade-out');
        aiBubble.classList.remove('visible');

        if (rateLimitReached) {
            return;
        }

        // Send to API
        try {
            const response = await sendMessageToApi(input, messages);
            const botText = response.text;
            
            messages.push({ text: botText, sender: 'model' });
            showBotMessage(botText);

            // Detect if bot is asking permission to sleep
            if (!isSleeping && !rateLimitReached) {
                const sleepPromptRegex = /(tupplur|får jag.*sova|kan jag.*sova|ska jag.*sova|sova nu|får jag ta en liten tupplur|får jag vila)/i;
                if (sleepPromptRegex.test(botText)) {
                    sleepRequested = true;
                } else {
                    sleepRequested = false;
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            let serverMsg;
            if (error.status === 429) {
                isSleeping = true;
                rateLimitReached = true;
                sleepRequested = false;
                updateCleoImage();
                serverMsg = error.message || 'Du har nått gränsen för idag. Jag sover nu.';
            } else {
                serverMsg = 'Error: Could not connect to the chatbot.';
            }
            
            messages.push({ text: serverMsg, sender: 'model' });
            showBotMessage(serverMsg);
        }
    }

    // API call with retry logic
    async function sendMessageToApi(message, history) {
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
                        sessionId
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

    // Show user bubble with last message
    function showUserBubble(text) {
        userBubbleContent.innerHTML = sanitizeAndLinkify(text);
        userBubble.style.opacity = '1';
        userBubble.classList.add('visible');
        userBubble.classList.remove('fade-out');
    }

    // Sanitize and linkify text (similar to React version)
    // This implementation escapes HTML first, then adds safe links
    function sanitizeAndLinkify(text) {
        if (!text) return '';
        
        // First, escape all HTML in the input to prevent XSS
        let content = escapeHtml(text);

        // 1. Convert Markdown links [text](url) to plain anchor
        // Pattern matches escaped brackets: [text](url)
        content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_m, label, url) {
            // URL and label are already escaped since we escaped the whole text first
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + 
                   (label === url ? url : label) + '</a>';
        });

        // 2. Extract existing anchors to avoid double-linkifying
        const anchorTokens = [];
        content = content.replace(/<a\b[^>]*>.*?<\/a>/gi, function(m) {
            const token = '__ANCHOR_' + anchorTokens.length + '__';
            anchorTokens.push(m);
            return token;
        });

        // 3. Linkify remaining plain URLs (these are already escaped)
        content = content.replace(/(https?:\/\/[^\s)<>"']+)/g, function(url) {
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
        });

        // 4. Restore anchors
        anchorTokens.forEach(function(a, i) {
            content = content.replace('__ANCHOR_' + i + '__', a);
        });

        return content;
    }

    // Escape HTML entities
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show chat history
    function showChatHistory() {
        historyMessages.innerHTML = '';
        
        messages.forEach(function(msg) {
            const div = document.createElement('div');
            div.className = 'history-message ' + msg.sender;
            
            const strong = document.createElement('strong');
            strong.textContent = msg.sender === 'user' ? 'You: ' : 'Cleo: ';
            
            div.appendChild(strong);
            
            const textSpan = document.createElement('span');
            textSpan.innerHTML = sanitizeAndLinkify(msg.text);
            div.appendChild(textSpan);
            
            historyMessages.appendChild(div);
        });
        
        chatHistoryModal.style.display = 'flex';
    }

    // Hide chat history
    function hideChatHistory() {
        chatHistoryModal.style.display = 'none';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
