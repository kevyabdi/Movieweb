import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Admin panel calls the API hosted on rajolabs.com
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://rajolabs.com";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
