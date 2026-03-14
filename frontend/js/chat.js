/**
 * Chat functionality module
 * Handles message sending, displaying, and chat interactions
 */

import { state, elements } from './state.js';
import { sendMessageToApi } from './api.js';
import { typewriterEffect, sanitizeAndLinkify, cancelTypewriter } from './utils.js';

/**
 * Update Cleo image based on sleeping state
 */
export function updateCleoImage() {
    if (state.isSleeping) {
        elements.cleoImage.src = 'assets/cleosleeping.png';
        elements.cleoImage.className = 'cleo-image cleo-sleeping-image';
    } else {
        elements.cleoImage.src = 'assets/cleo.png';
        elements.cleoImage.className = 'cleo-image';
    }
}

/**
 * Show bot message with typewriter effect
 * @param {string} text - Message text to display
 */
export function showBotMessage(text) {
    cancelTypewriter();
    elements.aiBubble.classList.add('visible');
    elements.aiBubble.classList.remove('fade-out');
    state.isTyping = true;
    
    typewriterEffect(elements.aiBubbleContent, text, 50, function() {
        state.isTyping = false;
    });
}

/**
 * Show user bubble with last message
 * @param {string} text - Message text to display
 */
export function showUserBubble(text) {
    elements.userBubbleContent.innerHTML = sanitizeAndLinkify(text);
    elements.userBubble.style.opacity = '1';
    elements.userBubble.classList.add('visible');
    elements.userBubble.classList.remove('fade-out');
}

/**
 * Handle sending a message
 */
export async function handleSendMessage() {
    const input = elements.chatInput.value.trim();
    if (input === '') return;

    const raw = input.toLowerCase();

    // If bot previously asked to sleep and user answers affirmatively
    if (state.sleepRequested && !state.isSleeping && !state.rateLimitReached) {
        const affirmativeTokenRegex = /\b(ja|japp|ok|okej|okay|yes|sure|absolut|gärna|visst|kör|gör det|låter bra|ta en tupplur|ta tupplur|sov)\b/i;
        const negativeRegex = /\b(nej|inte|ej|vill inte|no|nope)\b/i;
        
        if (affirmativeTokenRegex.test(raw) && !negativeRegex.test(raw)) {
            state.sleepRequested = false;
            state.isSleeping = true;
            updateCleoImage();
            
            state.messages.push({ text: input, sender: 'user' });
            const systemMsg = 'Zzz...';
            state.messages.push({ text: systemMsg, sender: 'model' });
            
            state.lastUserMessage = input;
            showUserBubble(input);
            showBotMessage(systemMsg);
            elements.chatInput.value = '';
            return;
        } else {
            state.sleepRequested = false;
        }
    }

    // Manual sleep command
    if (raw === 'sov' && !state.isSleeping && !state.rateLimitReached) {
        state.sleepRequested = false;
        state.isSleeping = true;
        updateCleoImage();
        
        state.messages.push({ text: input, sender: 'user' });
        const systemMsg = 'Zzz...';
        state.messages.push({ text: systemMsg, sender: 'model' });
        
        state.lastUserMessage = input;
        showUserBubble(input);
        showBotMessage(systemMsg);
        elements.chatInput.value = '';
        return;
    }

    // Wake up if sleeping
    if (state.isSleeping && !state.rateLimitReached) {
        state.isSleeping = false;
        updateCleoImage();
    }

    // Add user message
    state.messages.push({ text: input, sender: 'user' });
    state.lastUserMessage = input;
    showUserBubble(input);
    elements.chatInput.value = '';

    // Hide AI bubble while waiting
    elements.aiBubble.classList.add('fade-out');
    elements.aiBubble.classList.remove('visible');

    if (state.rateLimitReached) {
        return;
    }

    // Send to API
    try {
        const response = await sendMessageToApi(input, state.messages);
        const botText = response.text;
        
        state.messages.push({ text: botText, sender: 'model' });
        showBotMessage(botText);

        // Detect if bot is asking permission to sleep
        if (!state.isSleeping && !state.rateLimitReached) {
            const sleepPromptRegex = /(tupplur|får jag.*sova|kan jag.*sova|ska jag.*sova|sova nu|får jag ta en liten tupplur|får jag vila)/i;
            if (sleepPromptRegex.test(botText)) {
                state.sleepRequested = true;
            } else {
                state.sleepRequested = false;
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        let serverMsg;
        if (error.status === 429) {
            state.isSleeping = true;
            state.rateLimitReached = true;
            state.sleepRequested = false;
            updateCleoImage();
            serverMsg = error.message || 'Du har nått gränsen för idag. Jag sover nu.';
        } else {
            serverMsg = 'Error: Could not connect to the chatbot.';
        }
        
        state.messages.push({ text: serverMsg, sender: 'model' });
        showBotMessage(serverMsg);
    }
}
