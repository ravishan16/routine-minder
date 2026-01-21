import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// Register service worker with auto-reload on update
const updateSW = registerSW({
  onNeedRefresh() {
    // New content available, reload immediately
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
  onRegisteredSW(_swUrl: string, r: ServiceWorkerRegistration | undefined) {
    // Check for updates every 5 minutes
    if (r) {
      setInterval(() => {
        r.update();
      }, 5 * 60 * 1000);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
