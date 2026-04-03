/**
 * Conditional logger that only outputs in development mode
 * Prevents console pollution in production builds
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEV]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[DEV]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug('[DEV]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[DEV]', ...args);
    }
  }
};

export default logger;
