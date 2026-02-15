import { useSearchParams, Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

export default function OrderConfirmation() {
  const { slug: paramSlug } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-4">Thank you for your order</p>
          {orderNumber && <p className="font-mono text-sm bg-muted px-4 py-2 rounded-lg mb-6">{orderNumber}</p>}
          <Link to={getLink('/')}><Button>Continue Shopping</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
