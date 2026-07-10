// ─── Global App Configuration ────────────────────────────────────────────────

export const IS_CONSOLE = true; // Set to false to disable console logs/warnings/errors in production

// Helper function — use this instead of console.log/warn/error everywhere
export const appLog   = (...args) => { if (IS_CONSOLE) console.log(...args); };
export const appWarn  = (...args) => { if (IS_CONSOLE) console.warn(...args); };
export const appError = (...args) => { if (IS_CONSOLE) console.error(...args); };
