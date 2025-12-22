import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Phone } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: string;
  address: string | null;
  phone: string | null;
}

interface AdminSettingsProps {
  tenant: Tenant;
  disabled?: boolean;
}

export default function AdminSettings({ tenant, disabled }: AdminSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Store Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Store Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium">{tenant.store_name}</p>
              <p className="text-sm text-muted-foreground">/store/{tenant.store_slug}</p>
            </div>
            <Badge variant="outline" className="ml-auto">{tenant.business_type}</Badge>
          </div>

          {tenant.address && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{tenant.address}</p>
              </div>
            </div>
          )}

          {tenant.phone && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{tenant.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
