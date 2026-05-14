// Admin calls the API on rajolabs.com (the streamvault domain where the API is hosted).
// Override with VITE_API_URL if needed.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "https://rajolabs.com";
