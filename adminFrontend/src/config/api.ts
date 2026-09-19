/**
 * Centralized API base URL helper.
 * Automatically trims whitespace and strips any trailing slashes to prevent
 * duplicate slashes (e.g., https://api.domain.com//api/...) which trigger 308 redirects
 * that fail CORS preflight in modern browsers.
 */
export const getApiBase = (): string => {
  const raw = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  return raw.trim().replace(/\/+$/, '');
};

export const API_BASE = getApiBase();
