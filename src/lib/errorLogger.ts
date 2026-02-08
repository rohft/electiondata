/**
 * Secure error logging utility.
 * In production, suppresses console output to prevent sensitive data leakage.
 * In development, logs normally for debugging.
 */

const isDev = import.meta.env.MODE === 'development';

/**
 * Log an error securely. Only outputs to console in development mode.
 * @param context - A safe label describing where the error occurred (no PII)
 * @param _error - The error object (only logged in dev)
 */
export const logError = (context: string, _error?: unknown): void => {
  if (isDev) {
    console.error(`[${context}]`, _error);
  }
  // In production, errors are silently swallowed on the client.
  // A server-side logging service could be added here in the future.
};

/**
 * Log a warning securely. Only outputs to console in development mode.
 */
export const logWarning = (context: string, message?: string): void => {
  if (isDev) {
    console.warn(`[${context}]`, message);
  }
};
