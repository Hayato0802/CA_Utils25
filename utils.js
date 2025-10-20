// Utility functions for production/development mode

// Check if extension is in development mode
const isDevelopment = () => {
  return !('update_url' in chrome.runtime.getManifest());
};

// Safe console logging that only works in development
const log = (...args) => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

const warn = (...args) => {
  if (isDevelopment()) {
    console.warn(...args);
  }
};

const error = (...args) => {
  // Always log errors, but with less detail in production
  if (isDevelopment()) {
    console.error(...args);
  } else {
    console.error('An error occurred');
  }
};