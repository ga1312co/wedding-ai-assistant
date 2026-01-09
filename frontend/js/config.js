/**
 * Configuration module
 * Handles application configuration and environment settings
 */

// In production, we use the environment-injected config or fall back to localhost for dev
export const BASE_URL = window.appConfig?.backendUrl || 'http://localhost:3001';
