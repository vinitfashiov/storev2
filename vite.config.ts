import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://yqokqlkymnzbeceasrui.supabase.co';

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/supabase-api': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        },
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        // We manage SW registration manually in src/main.tsx for deterministic updates.
        // Having both auto-injected registration + manual registration can cause “one publish behind”.
        injectRegister: null,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'og-image.png'],
        manifest: {
          name: 'Storekriti - D2C Ecommerce Platform',
          short_name: 'Storekriti',
          description: 'Launch your online store in minutes. Multi-tenant platform for e-commerce and grocery stores.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          categories: ['shopping', 'business', 'productivity'],
          screenshots: [
            {
              src: '/dashboard.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard'
            }
          ]
        },
        workbox: {
          // Critical: ensure new publishes are reflected immediately.
          // - skipWaiting/clientsClaim: new SW takes control right away
          // - NetworkFirst for navigations: prevents stale index.html/app-shell causing "one publish behind"
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              // Always revalidate HTML navigations so updated index.html is picked up immediately
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /.*\/supabase-api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ].filter(Boolean),
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
  };
});
