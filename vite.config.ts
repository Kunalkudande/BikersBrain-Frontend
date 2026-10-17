import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000';

  return {
  server: {
    host: "::",
    port: 3000,
    hmr: { overlay: false },
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
      },
    },
  },
  plugins: [react()],
  ssr: { noExternal: ["react-helmet-async"] },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: isSsrBuild ? undefined : {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "lucide-react"],
        },
      },
    },
  },
  };
});
