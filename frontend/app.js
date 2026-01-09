/**
 * Wedding AI Assistant - Application Entry Point
 * 
 * This file serves as the entry point for the modular JavaScript application.
 * All functionality has been split into separate modules for better organization:
 * 
 * - js/config.js: Configuration constants
 * - js/state.js: State management and DOM element references
 * - js/utils.js: Utility functions (sanitization, typewriter effect)
 * - js/api.js: API communication with the backend
 * - js/login.js: Login functionality
 * - js/chat.js: Chat messaging functionality
 * - js/modal.js: Modal dialogs (RSVP, chat history)
 * - js/main.js: Main initialization and event setup
 * 
 * The application is initialized from js/main.js when loaded as a module.
 */

// Import the main module to initialize the application
import './js/main.js';
