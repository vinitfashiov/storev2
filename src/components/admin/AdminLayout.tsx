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
  tenantId: string;
  businessType?: 'ecommerce' | 'grocery';
  userRole?: 'owner' | 'super_admin';
  onSignOut: () => void;
  onTenantChange: (tenantId: string) => void;
  isTrialExpired: boolean;
  onUpgrade: () => void;
}

import { MobileBottomNav } from './mobile/MobileBottomNav';

export function AdminLayout({
  children,
  storeName,
  storeSlug,
  tenantId,
  businessType,
  userRole,
  onSignOut,
  onTenantChange,
  isTrialExpired,
  onUpgrade
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <AdminSidebar storeSlug={storeSlug} storeName={storeName} businessType={businessType} userRole={userRole} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Header (Global) */}
        <AdminHeader
          storeName={storeName}
          storeSlug={storeSlug}
          tenantId={tenantId}
          businessType={businessType}
          onSignOut={onSignOut}
          onTenantChange={onTenantChange}
        />

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
                  <span className="hidden sm:inline">Upgrade to Pro - </span>₹1/mo
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Bottom Nav - Mobile Only */}
        <div className="md:hidden">
          <MobileBottomNav storeSlug={storeSlug} />
        </div>
      </div>
    </div>
  );
}
