import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  LogOut,
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Settings,
  Plug,
  Store,
  ExternalLink,
  MapPin,
  Clock,
  Truck,
  Grid,
  CreditCard,
  Tag,
  Layers,
  Ticket,
  Users,
  Image,
  FileText,
  Palette,
  Crown,
  Warehouse,
  ClipboardList,
  Monitor,
  BarChart3,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderTree },
  { href: '/dashboard/brands', label: 'Brands', icon: Tag },
  { href: '/dashboard/attributes', label: 'Attributes', icon: Layers },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/coupons', label: 'Coupons', icon: Ticket },
  { href: '/dashboard/payment-intents', label: 'Payment Intents', icon: CreditCard },
];

const inventoryNavItems = [
  { href: '/dashboard/inventory', label: 'Stock Management', icon: Warehouse },
  { href: '/dashboard/suppliers', label: 'Suppliers', icon: Users },
  { href: '/dashboard/purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
];

const groceryNavItems = [
  { href: '/dashboard/batches', label: 'Batches & Expiry', icon: Calendar },
  { href: '/dashboard/pos', label: 'POS Terminal', icon: Monitor },
  { href: '/dashboard/pos-reports', label: 'POS Reports', icon: BarChart3 },
  { href: '/dashboard/delivery-boys', label: 'Delivery Boys', icon: Users },
  { href: '/dashboard/delivery-areas', label: 'Delivery Areas', icon: MapPin },
  { href: '/dashboard/delivery-orders', label: 'Delivery Orders', icon: Truck },
  { href: '/dashboard/delivery-payouts', label: 'Delivery Payouts', icon: CreditCard },
  { href: '/dashboard/delivery-slots', label: 'Delivery Slots', icon: Clock },
  { href: '/dashboard/delivery-settings', label: 'Delivery Settings', icon: Truck },
  { href: '/dashboard/product-availability', label: 'Zone Availability', icon: Grid },
];

const storeNavItems = [
  { href: '/dashboard/store-settings', label: 'Store Settings', icon: Palette },
  { href: '/dashboard/banners', label: 'Banners', icon: Image },
  { href: '/dashboard/pages', label: 'Pages', icon: FileText },
  { href: '/dashboard/domains', label: 'Custom Domains', icon: ExternalLink },
];

const settingsNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/upgrade', label: 'Upgrade Plan', icon: Crown },
];

interface AdminHeaderProps {
  storeName: string;
  storeSlug?: string;
  businessType?: 'ecommerce' | 'grocery';
  onSignOut: () => void;
}

export function AdminHeader({ storeName, storeSlug, businessType, onSignOut }: AdminHeaderProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isGrocery = businessType === 'grocery';

  const navItems = [
    ...baseNavItems,
    ...inventoryNavItems,
    ...(isGrocery ? groceryNavItems : []),
    ...storeNavItems,
    ...settingsNavItems
  ];

  const currentPage = navItems.find(item => 
    location.pathname === item.href || 
    (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
  )?.label || 'Dashboard';

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-semibold truncate">{storeName}</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </div>
              
              <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-border space-y-1">
                {storeSlug && (
                  <Link 
                    to={`/store/${storeSlug}`} 
                    target="_blank"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    View Storefront
                  </Link>
                )}
                <button
                  onClick={() => { setIsOpen(false); onSignOut(); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
          
          <h2 className="font-display font-semibold text-foreground text-sm md:text-base">
            {currentPage}
          </h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onSignOut} className="hidden md:flex">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
