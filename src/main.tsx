import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { frontendMonitor } from "./lib/monitoring";

// Initialize monitoring in production
if (import.meta.env.PROD) {
  frontendMonitor.init();
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
