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
  businessType?: 'ecommerce' | 'grocery';
  onSignOut: () => void;
  isTrialExpired: boolean;
  onUpgrade: () => void;
}

export function AdminLayout({ 
  children, 
  storeName, 
  storeSlug, 
  businessType,
  onSignOut,
  isTrialExpired,
  onUpgrade
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar storeSlug={storeSlug} storeName={storeName} businessType={businessType} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader storeName={storeName} storeSlug={storeSlug} businessType={businessType} onSignOut={onSignOut} />
        
        {isTrialExpired && (
          <div className="p-3 md:p-4">
            <div className="border border-destructive bg-destructive/5 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive text-sm md:text-base">Your trial has expired</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Upgrade now to restore full access</p>
                  </div>
                </div>
                <Button onClick={onUpgrade} size="sm" className="shadow-glow">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upgrade to Pro - </span>₹249/mo
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
