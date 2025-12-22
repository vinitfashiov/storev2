import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  storeName: string;
  storeSlug: string;
  onSignOut: () => void;
  isTrialExpired: boolean;
  onUpgrade: () => void;
}

export function AdminLayout({ 
  children, 
  storeName, 
  storeSlug, 
  onSignOut,
  isTrialExpired,
  onUpgrade
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar storeSlug={storeSlug} storeName={storeName} />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader storeName={storeName} onSignOut={onSignOut} />
        
        {isTrialExpired && (
          <div className="p-4">
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Your trial has expired</p>
                      <p className="text-sm text-muted-foreground">Upgrade now to restore full access</p>
                    </div>
                  </div>
                  <Button onClick={onUpgrade} className="shadow-glow">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade to Pro - ₹249/mo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
