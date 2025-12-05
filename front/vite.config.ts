import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      core: path.resolve(__dirname, "./src/core"),
      layers: path.resolve(__dirname, "./src/layers"),
      routes: path.resolve(__dirname, "./src/routes"),
      api: path.resolve(__dirname, "./src/api"),
      assets: path.resolve(__dirname, "./src/assets"),
      img: path.resolve(__dirname, "./src/assets/img"),
    },
  },
  server: {
    host: true,
    port: 3001,
  },
});
