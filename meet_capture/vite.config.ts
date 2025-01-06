import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.ts"),
        contentScript: resolve(__dirname, "src/contentScript.ts"),
        offscreenScript: resolve(__dirname, "src/offscreenScript.ts"),
        offscreen: resolve(__dirname, "offscreen.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    outDir: "dist", 
    target: "esnext", 
    sourcemap: false, 
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), 
    },
  },
});
