// API lives on the same domain (rajolabs.com/api/...) — use relative paths.
// Override with VITE_API_URL if you need to point at a different backend.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";
