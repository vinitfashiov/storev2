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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification and tree-shaking
    minify: 'esbuild',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          'editor-core': ['grapesjs'],
          'editor-plugins': ['grapesjs-preset-webpage', 'grapesjs-plugin-forms'],
          'vendor-maps': ['react-globe.gl'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable source maps for production debugging
    sourcemap: mode === 'development',
  },
}));
