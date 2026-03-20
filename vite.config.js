import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/gridfinity-app---inwork/", // <--- Add this line
  plugins: [reactPlugin()],
  build: {
    outDir: "build",
  },
  server: {
    port: 4444,
  },
});