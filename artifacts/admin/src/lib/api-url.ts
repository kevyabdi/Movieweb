// Admin calls the dedicated API server at api.rajolabs.com.
// Override with VITE_API_URL if deploying to a different domain.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "https://api.rajolabs.com";
