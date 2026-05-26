// ─── Global App Configuration ────────────────────────────────────────────────

// Set to true during development to see all console logs
// Set to false for production — all console logs are silenced
export const IS_CONSOLE = true;

// Helper function — use this instead of console.log/warn/error everywhere
export const appLog   = (...args) => { if (IS_CONSOLE) console.log(...args); };
export const appWarn  = (...args) => { if (IS_CONSOLE) console.warn(...args); };
export const appError = (...args) => { if (IS_CONSOLE) console.error(...args); };
