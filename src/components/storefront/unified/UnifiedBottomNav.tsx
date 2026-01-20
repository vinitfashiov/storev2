import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedBottomNavProps {
  storeSlug: string;
  cartCount: number;
  accentColor?: string;
}

export function UnifiedBottomNav({ storeSlug, cartCount, accentColor = 'green' }: UnifiedBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: `/store/${storeSlug}`,
      exact: true 
    },
    { 
      icon: Grid3X3, 
      label: 'Categories', 
      path: `/store/${storeSlug}/categories`,
      exact: false 
    },
    { 
      icon: ShoppingCart, 
      label: 'Cart', 
      path: `/store/${storeSlug}/cart`,
      exact: true,
      badge: cartCount
    },
    { 
      icon: User, 
      label: 'Account', 
      path: `/store/${storeSlug}/account`,
      exact: false 
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    return currentPath.startsWith(item.path);
  };

  const activeColorClass = accentColor === 'green' ? 'text-green-600' : 'text-primary';
  const badgeBgClass = accentColor === 'green' ? 'bg-green-600' : 'bg-primary';
  const indicatorBgClass = accentColor === 'green' ? 'bg-green-600' : 'bg-primary';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-colors",
                active ? activeColorClass : "text-neutral-500"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    "absolute -top-2 -right-2 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold",
                    badgeBgClass
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                active ? activeColorClass : "text-neutral-500"
              )}>
                {item.label}
              </span>
              {active && (
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                  indicatorBgClass
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
