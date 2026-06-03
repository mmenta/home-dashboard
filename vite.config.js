import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev`, the React app runs on :5173 and proxies /api to the
// BFF on :8080 so you get the same relative-URL behaviour as in production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
