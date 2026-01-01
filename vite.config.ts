import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@zip.js/zip.js/lib/zip-no-worker.js": "@zip.js/zip.js/dist/zip-no-worker.min.js",
    },
  },
  optimizeDeps: {
    include: ["cesium"],
  },
  build: {
    commonjsOptions: {
      include: [/cesium/, /node_modules/],
    },
  },
}));
