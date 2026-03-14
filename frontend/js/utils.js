/**
 * Utility functions module
 * Contains helper functions for text processing and effects
 */

import { state } from './state.js';

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML string
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize and linkify text
 * Escapes HTML first, then adds safe links
 * @param {string} text - Text to process
 * @returns {string} - Sanitized HTML with links
 */
export function sanitizeAndLinkify(text) {
    if (!text) return '';
    
    // First, escape all HTML in the input to prevent XSS
    let content = escapeHtml(text);

    // 1. Convert Markdown links [text](url) to plain anchor
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_m, label, url) {
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

/**
 * Typewriter effect for text animation
 * @param {HTMLElement} element - Element to type into
 * @param {string} text - Text to type
 * @param {number} delay - Delay between characters in ms
 * @param {Function} onComplete - Callback when complete
 */
export function typewriterEffect(element, text, delay, onComplete) {
    let index = 0;
    element.textContent = '';
    
    function type() {
        if (index < text.length) {
            element.textContent = text.substring(0, index + 1);
            index++;
            state.currentTypewriterTimeout = setTimeout(type, delay);
        } else if (onComplete) {
            onComplete();
        }
    }
    type();
}

/**
 * Cancel any ongoing typewriter effect
 */
export function cancelTypewriter() {
    if (state.currentTypewriterTimeout) {
        clearTimeout(state.currentTypewriterTimeout);
        state.currentTypewriterTimeout = null;
    }
}
