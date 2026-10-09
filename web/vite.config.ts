import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// allowedHosts: true lets the sandbox live-preview host (and Vercel previews) reach the dev server.
export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173, allowedHosts: true },
  preview: { host: "0.0.0.0", port: 4173, allowedHosts: true },
});
