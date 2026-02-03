import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { frontendMonitor } from "./lib/monitoring";

// Ensure published updates reflect immediately (prevents "one publish behind" due to SW waiting)
import { registerSW } from 'virtual:pwa-register';

// Initialize monitoring in production
if (import.meta.env.PROD) {
  frontendMonitor.init();
}

// Force PWA service worker updates to activate immediately after deploy.
// Without this, the new service worker can sit in "waiting" and only take effect on the next navigation,
// which feels like every publish is one step delayed.
if (import.meta.env.PROD) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Activate the new SW and reload to fetch the latest assets.
        updateSW(true);
      },
    });

    // Also check for updates when the tab regains focus (common after publishing).
    window.addEventListener('focus', () => updateSW(true));
  } catch {
    // no-op: app should still run even if SW registration fails
  }
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
