import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// API is co-hosted on admin.rajolabs.com (/api/...) — no base URL needed.
// Set VITE_API_URL only when pointing at a different backend (e.g. local dev).
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
