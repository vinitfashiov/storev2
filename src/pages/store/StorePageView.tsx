import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { useCart } from '@/hooks/useCart';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { FileText, ArrowLeft } from 'lucide-react';

interface StorePage {
  id: string;
  title: string;
  slug: string;
  content_html: string;
}

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

interface StoreSettings {
  logo_path: string | null;
  store_email: string | null;
  store_phone: string | null;
  store_address: string | null;
}

export default function StorePageView() {
  const { slug: paramSlug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [page, setPage] = useState<StorePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  const { itemCount } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !pageSlug) {
        setError('Page not found');
        setLoading(false);
        return;
      }

      // Fetch tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantError || !tenantData) {
        setError('Store not found');
        setLoading(false);
        return;
      }

      setTenant(tenantData as Tenant);

      // Fetch store settings
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('logo_path, store_email, store_phone, store_address')
        .eq('tenant_id', tenantData.id)
        .maybeSingle();

      if (settingsData) {
        setStoreSettings(settingsData);
      }

      // Fetch page
      const { data: pageData, error: pageError } = await supabase
        .from('store_pages')
        .select('id, title, slug, content_html')
        .eq('tenant_id', tenantData.id)
        .eq('slug', pageSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (pageError || !pageData) {
        setError('Page not found');
        setLoading(false);
        return;
      }

      setPage(pageData);
      setLoading(false);
    };

    fetchData();
  }, [slug, pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{error || 'Page not found'}</h1>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been removed.
            </p>
            <Link to={getLink('/')}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        logoPath={storeSettings?.logo_path}
      />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to={getLink('/')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Store
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
            {page?.title}
          </h1>

          {page?.content_html ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(page.content_html, {
                  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i', 'u', 'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'pre', 'code'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel'],
                  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
                  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
                })
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">This page has no content yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={storeSettings?.store_address || tenant.address}
        phone={storeSettings?.store_phone || tenant.phone}
        email={storeSettings?.store_email}
      />
    </div>
  );
}
