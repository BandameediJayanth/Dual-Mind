import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./",
  base: "./",
  publicDir: "public",
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      "/api/ml": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "framer-motion"],
          anime: ["animejs"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      "@games": "/src/js/games",
      "@ml": "/src/js/ml",
    },
  },
});
