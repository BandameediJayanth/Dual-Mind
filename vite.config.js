import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "./",
  publicDir: "assets",
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      "/api/ml": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    minify: "terser",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
      output: {
        manualChunks: {
          games: [
            "./src/js/games/TicTacToe.js",
            "./src/js/games/FourInARow.js",
            "./src/js/games/Checkers.js",
            "./src/js/games/DotsAndBoxes.js",
            "./src/js/games/MemoryMatch.js",
            "./src/js/games/WordChain.js",
            "./src/js/games/Ludo.js",
            "./src/js/games/SnakeAndLadders.js",
            "./src/js/games/ColorWars.js",
            "./src/js/games/SeaWars.js",
          ],
          core: [
            "./src/js/core/EventBus.js",
            "./src/js/core/GameController.js",
            "./src/js/ui/UIManager.js",
            "./src/js/storage/StorageManager.js",
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src/js",
      "@games": "/src/js/games",
      "@core": "/src/js/core",
      "@ml": "/src/js/ml",
      "@ui": "/src/js/ui",
    },
  },
});
