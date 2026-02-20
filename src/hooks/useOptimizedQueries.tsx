/**
 * Enterprise-level optimized queries with React Query caching
 * Designed for 100,000+ users/day with intelligent caching strategies
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Cache time constants (in milliseconds)
const CACHE_TIME = {
  SHORT: 1000 * 60 * 2,      // 2 minutes - for frequently changing data
  MEDIUM: 1000 * 60 * 5,     // 5 minutes - for moderately changing data
  LONG: 1000 * 60 * 15,      // 15 minutes - for rarely changing data
  STATIC: 1000 * 60 * 60,    // 1 hour - for static data
};

const STALE_TIME = {
  SHORT: 1000 * 30,          // 30 seconds
  MEDIUM: 1000 * 60 * 2,     // 2 minutes
  LONG: 1000 * 60 * 5,       // 5 minutes
};

// ========================
// STOREFRONT QUERIES
// ========================

export function useStoreData(slug: string | undefined) {
  return useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, plan, trial_ends_at, is_active, address, phone')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
  });
}

export function useStoreSettings(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['store-settings', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.STATIC,
  });
}

export function useStoreBanners(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['store-banners', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('store_banners')
        .select('id, title, subtitle, image_path, cta_text, cta_url, device_type')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
  });
}

export function useStoreCategories(tenantId: string | undefined, limit = 12) {
  return useQuery({
    queryKey: ['store-categories', tenantId, limit],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, image_path')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
  });
}

export function useStoreBrands(tenantId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['store-brands', tenantId, limit],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_path')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
  });
}

interface ProductsQueryParams {
  tenantId: string | undefined;
  categoryId?: string;
  brandId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'price-asc' | 'price-desc' | 'created';
}

export function useStoreProducts({
  tenantId,
  categoryId,
  brandId,
  search,
  limit = 20,
  offset = 0,
  sortBy = 'created'
}: ProductsQueryParams) {
  return useQuery({
    queryKey: ['store-products', tenantId, categoryId, brandId, search, limit, offset, sortBy],
    queryFn: async () => {
      if (!tenantId) return { products: [], total: 0 };

      let query = supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants, category:categories(name), brand:brands(name)', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (brandId) query = query.eq('brand_id', brandId);
      if (search) query = query.ilike('name', `%${search}%`);

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'name') query = query.order('name', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch variant stocks in parallel for products with variants
      const productsWithVariants = (data || []).filter(p => p.has_variants);
      let variantStocks: Record<string, number> = {};

      if (productsWithVariants.length > 0) {
        const { data: variants } = await supabase
          .from('product_variants')
          .select('product_id, stock_qty')
          .in('product_id', productsWithVariants.map(p => p.id))
          .eq('is_active', true);

        if (variants) {
          variantStocks = variants.reduce((acc, v) => {
            acc[v.product_id] = (acc[v.product_id] || 0) + v.stock_qty;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const products = (data || []).map(p => ({
        ...p,
        images: Array.isArray(p.images) ? (p.images as string[]) : [],
        total_variant_stock: p.has_variants ? (variantStocks[p.id] || 0) : undefined
      }));

      return { products, total: count || 0 };
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
  });
}

export function useProductDetail(tenantId: string | undefined, productSlug: string | undefined) {
  return useQuery({
    queryKey: ['product-detail', tenantId, productSlug],
    queryFn: async () => {
      if (!tenantId || !productSlug) return null;

      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          brand:brands(id, name, slug),
          variants:product_variants(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return product;
    },
    enabled: !!tenantId && !!productSlug,
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.MEDIUM,
  });
}

// ========================
// ADMIN QUERIES
// ========================

interface PaginatedOrdersParams {
  tenantId: string;
  status?: string;
  paymentStatus?: string;
  page: number;
  limit: number;
}

export function useAdminOrders({ tenantId, status, paymentStatus, page, limit }: PaginatedOrdersParams) {
  return useQuery({
    queryKey: ['admin-orders', tenantId, status, paymentStatus, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') query = query.eq('status', status);
      if (paymentStatus && paymentStatus !== 'all') query = query.eq('payment_status', paymentStatus);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        orders: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      };
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
  });
}

interface PaginatedProductsParams {
  tenantId: string;
  search?: string;
  page: number;
  limit: number;
}

export function useAdminProducts({ tenantId, search, page, limit }: PaginatedProductsParams) {
  return useQuery({
    queryKey: ['admin-products', tenantId, search, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('products')
        .select('id, name, slug, price, stock_qty, is_active, has_variants, images, category:categories(name), brand:brands(name)', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) query = query.ilike('name', `%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      const processed = (data || []).map(p => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : []
      }));

      return {
        products: processed,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      };
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
  });
}

interface PaginatedCustomersParams {
  tenantId: string;
  search?: string;
  page: number;
  limit: number;
}

export function useAdminCustomers({ tenantId, search, page, limit }: PaginatedCustomersParams) {
  return useQuery({
    queryKey: ['admin-customers', tenantId, search, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        customers: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      };
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
  });
}

export function useDashboardStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
  });
}

export function useAnalyticsSummary(tenantId: string | undefined, dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['analytics-summary', tenantId, dateRange.from, dateRange.to],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase.rpc('get_analytics_summary', {
        p_tenant_id: tenantId,
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });
}

export function useRecentOrders(tenantId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ['recent-orders', tenantId, limit],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          created_at,
          payment_status,
          customer_name
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: STALE_TIME.SHORT,
  });
}

// ========================
// MUTATION HOOKS
// ========================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
    },
  });
}

// ========================
// PREFETCH UTILITIES
// ========================

export function usePrefetchStoreData(queryClient: ReturnType<typeof useQueryClient>, slug: string) {
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['store', slug],
      queryFn: async () => {
        const { data } = await supabase
          .from('tenants')
          .select('id, store_name, store_slug, business_type, plan, trial_ends_at, is_active, address, phone')
          .eq('store_slug', slug)
          .eq('is_active', true)
          .maybeSingle();
        return data;
      },
      staleTime: STALE_TIME.LONG,
    });
  };
}
