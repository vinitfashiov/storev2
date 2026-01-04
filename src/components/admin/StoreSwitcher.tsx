import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Store, ChevronDown, Plus, Check, Settings } from 'lucide-react';

interface StoreSwitcherProps {
  currentTenantId: string;
  storeName: string;
  onTenantChange: (tenantId: string) => void;
}

export function StoreSwitcher({ currentTenantId, storeName, onTenantChange }: StoreSwitcherProps) {
  const navigate = useNavigate();
  const { tenants } = useAuth();

  const handleSwitchStore = (tenantId: string) => {
    if (tenantId !== currentTenantId) {
      onTenantChange(tenantId);
    }
  };

  const handleManageStores = () => {
    navigate('/dashboard/stores');
  };

  const handleCreateStore = () => {
    navigate('/onboarding');
  };

  // If only one store, show simple button
  if (tenants.length <= 1) {
    return (
      <Button variant="outline" className="gap-2" onClick={handleManageStores}>
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline truncate max-w-[120px]">
          {storeName || 'My Store'}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline truncate max-w-[120px]">
            {storeName || 'My Store'}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your Stores</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSwitchStore(tenant.id)}
            className="cursor-pointer"
          >
            <Store className="w-4 h-4 mr-2" />
            <span className="flex-1 truncate">{tenant.store_name}</span>
            {tenant.id === currentTenantId && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleManageStores} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Manage Stores
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCreateStore} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Create New Store
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
