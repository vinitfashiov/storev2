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
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderTree },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
];

interface AdminHeaderProps {
  storeName: string;
  onSignOut: () => void;
}

export function AdminHeader({ storeName, onSignOut }: AdminHeaderProps) {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display font-semibold">{storeName}</h1>
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
                        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          
          <h2 className="font-display font-semibold text-foreground hidden md:block">
            {navItems.find(item => 
              location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            )?.label || 'Dashboard'}
          </h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
