// ─── Global App Configuration ────────────────────────────────────────────────

export const IS_CONSOLE = true; // true = dev, false = prod

// Helper function — use this instead of console.log/warn/error everywhere
export const appLog   = (...args) => { if (IS_CONSOLE) console.log(...args); };
export const appWarn  = (...args) => { if (IS_CONSOLE) console.warn(...args); };
export const appError = (...args) => { if (IS_CONSOLE) console.error(...args); };
