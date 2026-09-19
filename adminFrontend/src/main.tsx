// @ts-nocheck
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  // Normalize URL to eliminate duplicate slashes (e.g. https://domain.com//api -> https://domain.com/api)
  // This prevents 308 Permanent Redirects on CORS preflight (OPTIONS) requests
  if (typeof args[0] === 'string') {
    args[0] = args[0].replace(/([^:])\/\/+/g, '$1/');
  } else if (args[0] && typeof args[0].url === 'string') {
    const cleanUrl = args[0].url.replace(/([^:])\/\/+/g, '$1/');
    if (cleanUrl !== args[0].url) {
      args[0] = new Request(cleanUrl, args[0]);
    }
  }

  const res = await originalFetch(...args);
  if (res.status === 403) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const isLoginRequest = url.includes('/login');
    if (!isLoginRequest) {
      const clone = res.clone();
      try {
        const data = await clone.json();
        if (data && data.message && (
          data.message.toLowerCase().includes('suspended') ||
          data.message.toLowerCase().includes('role has been updated')
        )) {
          alert(data.message);
          localStorage.removeItem('grocery_session');
          window.location.href = '/';
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return res;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
