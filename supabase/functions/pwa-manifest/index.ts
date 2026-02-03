import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Version for deployment verification
const VERSION = "v1.0.1"
const DEPLOYED_AT = new Date().toISOString()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/manifest+json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
}

Deno.serve(async (req) => {
  console.log(`[${VERSION}] PWA Manifest request received at ${new Date().toISOString()}`)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') // 'admin' or 'storefront'
    const slug = url.searchParams.get('slug') // store slug for storefront
    const tenantId = url.searchParams.get('tenant_id') // alternative to slug

    // Admin Dashboard PWA - Updated status bar colors
    if (type === 'admin') {
      console.log(`[${VERSION}] Serving admin manifest`)
      const adminManifest = {
        name: 'Storekriti Admin',
        short_name: 'SK Admin',
        description: 'Manage your Storekriti store - orders, products, analytics and more',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/dashboard',
        start_url: '/dashboard',
        id: '/dashboard',
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
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Orders',
            short_name: 'Orders',
            url: '/dashboard/orders',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Products',
            short_name: 'Products',
            url: '/dashboard/products',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Analytics',
            short_name: 'Analytics',
            url: '/dashboard/analytics',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }

      console.log(`[${VERSION}] Admin manifest served successfully`)
      return new Response(JSON.stringify({ ...adminManifest, _version: VERSION }, null, 2), {
        headers: corsHeaders,
      })
    }

    // Storefront PWA - requires slug or tenant_id
    if (type === 'storefront' && (slug || tenantId)) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Fetch tenant info
      let tenantQuery = supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type')
        .eq('is_active', true)

      if (slug) {
        tenantQuery = tenantQuery.eq('store_slug', slug)
      } else if (tenantId) {
        tenantQuery = tenantQuery.eq('id', tenantId)
      }

      const { data: tenant, error: tenantError } = await tenantQuery.single()

      if (tenantError || !tenant) {
        return new Response(JSON.stringify({ error: 'Store not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch store settings for branding
      const { data: settings } = await supabase
        .from('store_settings')
        .select('logo_path, favicon_path, website_title, website_description')
        .eq('tenant_id', tenant.id)
        .single()

      // Build icon URLs
      const iconBase = settings?.favicon_path || settings?.logo_path
      let icons = [
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
        }
      ]

      // If store has custom favicon/logo, use it
      if (iconBase) {
        const iconUrl = `${supabaseUrl}/storage/v1/object/public/store-assets/${iconBase}`
        icons = [
          {
            src: iconUrl,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: iconUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }

      // Theme color based on business type
      const themeColor = tenant.business_type === 'grocery' ? '#059669' : '#6366f1'

      const storefrontManifest = {
        name: settings?.website_title || tenant.store_name,
        short_name: tenant.store_name.substring(0, 12),
        description: settings?.website_description || `Shop at ${tenant.store_name}`,
        theme_color: themeColor,
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: `/store/${tenant.store_slug}`,
        start_url: `/store/${tenant.store_slug}`,
        id: `/store/${tenant.store_slug}`,
        icons,
        categories: ['shopping', 'lifestyle'],
        shortcuts: [
          {
            name: 'Shop',
            short_name: 'Shop',
            url: `/store/${tenant.store_slug}/products`,
            icons: [{ src: icons[0].src, sizes: '192x192' }]
          },
          {
            name: 'Cart',
            short_name: 'Cart',
            url: `/store/${tenant.store_slug}/cart`,
            icons: [{ src: icons[0].src, sizes: '192x192' }]
          },
          {
            name: 'Orders',
            short_name: 'Orders',
            url: `/store/${tenant.store_slug}/account/orders`,
            icons: [{ src: icons[0].src, sizes: '192x192' }]
          }
        ]
      }

      return new Response(JSON.stringify(storefrontManifest, null, 2), {
        headers: corsHeaders,
      })
    }

    // Default fallback - platform manifest
    const defaultManifest = {
      name: 'Storekriti',
      short_name: 'Storekriti',
      description: 'India\'s First D2C Ecommerce Business Enabler',
      theme_color: '#6366f1',
      background_color: '#ffffff',
      display: 'standalone',
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
        }
      ]
    }

    return new Response(JSON.stringify(defaultManifest, null, 2), {
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Error generating manifest:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
