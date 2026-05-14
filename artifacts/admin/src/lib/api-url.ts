// API is co-hosted on the same domain (/api/...) — use relative paths by default.
// Set VITE_API_URL only if you need to point at a different backend (e.g. local dev).
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";
