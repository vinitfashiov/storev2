import { Link } from 'react-router-dom';
import { Store, ShoppingCart, Search, User, LogOut, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStoreAuth } from '@/contexts/StoreAuthContext';

interface StoreHeaderProps {
  storeName: string;
  storeSlug: string;
  businessType: 'ecommerce' | 'grocery';
  cartCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function StoreHeader({
  storeName,
  storeSlug,
  businessType,
  cartCount,
  searchQuery,
  onSearchChange
}: StoreHeaderProps) {
  const { customer, signOut } = useStoreAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to={`/store/${storeSlug}`} className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold text-foreground">{storeName}</h1>
              <Badge variant="secondary" className="text-xs">
                {businessType === 'grocery' ? '🍎 Grocery' : '🛒 E-Commerce'}
              </Badge>
            </div>
          </Link>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/store/${storeSlug}/products`}>
              <Button variant="ghost" size="sm">Products</Button>
            </Link>
            
            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {customer ? customer.name.split(' ')[0] : 'Account'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {customer ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`/store/${storeSlug}/account`} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/store/${storeSlug}/account/orders`} className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/store/${storeSlug}/account/addresses`} className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Addresses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`/store/${storeSlug}/login`} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/store/${storeSlug}/signup`} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Create Account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to={`/store/${storeSlug}/cart`}>
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
