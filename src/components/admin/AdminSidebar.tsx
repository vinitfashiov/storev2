import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
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
  Crown
} from 'lucide-react';

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

const groceryNavItems = [
  { href: '/dashboard/delivery-zones', label: 'Delivery Zones', icon: MapPin },
  { href: '/dashboard/delivery-slots', label: 'Delivery Slots', icon: Clock },
  { href: '/dashboard/delivery-settings', label: 'Delivery Settings', icon: Truck },
  { href: '/dashboard/product-availability', label: 'Zone Availability', icon: Grid },
];

const storeNavItems = [
  { href: '/dashboard/store-settings', label: 'Store Settings', icon: Palette },
  { href: '/dashboard/banners', label: 'Banners', icon: Image },
  { href: '/dashboard/pages', label: 'Pages', icon: FileText },
];

const settingsNavItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/upgrade', label: 'Upgrade Plan', icon: Crown },
];

interface AdminSidebarProps {
  storeSlug: string;
  storeName: string;
  businessType?: 'ecommerce' | 'grocery';
}

export function AdminSidebar({ storeSlug, storeName, businessType }: AdminSidebarProps) {
  const location = useLocation();
  const isGrocery = businessType === 'grocery';

  const navItems = [
    ...baseNavItems,
    ...(isGrocery ? groceryNavItems : []),
    ...storeNavItems,
    ...settingsNavItems
  ];

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen p-4 hidden md:block">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-foreground truncate">{storeName}</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Link 
          to={`/store/${storeSlug}`} 
          target="_blank"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Storefront
        </Link>
      </div>
    </aside>
  );
}
