import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Store, Plus, ExternalLink, Trash2, Star, Check, ShoppingCart, Apple, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdminStoresProps {
  onTenantChange: (tenantId: string) => void;
  onRefresh: () => Promise<void>;
}

export default function AdminStores({ onTenantChange, onRefresh }: AdminStoresProps) {
  const navigate = useNavigate();
  const { tenants, tenant: currentTenant, user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateStore = () => {
    navigate('/onboarding?new=true');
  };

  const handleSwitchStore = async (tenantId: string) => {
    if (tenantId === currentTenant?.id) return;
    onTenantChange(tenantId);
  };

  const handleDeleteClick = (tenantId: string) => {
    if (tenants.length <= 1) {
      toast.error('You cannot delete your only store');
      return;
    }
    setStoreToDelete(tenantId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    setConfirmDialogOpen(true);
    setConfirmText('');
  };

  const handleFinalDelete = async () => {
    if (!storeToDelete || confirmText !== 'DELETE') return;

    setIsDeleting(true);

    try {
      const { error } = await supabase.rpc('delete_tenant', { target_tenant_id: storeToDelete });

      if (error) throw error;

      toast.success('Store deleted successfully');
      setConfirmDialogOpen(false);
      setStoreToDelete(null);
      setConfirmText('');

      // Refresh tenants and switch to another store if we deleted the current one
      await onRefresh();
      
      if (storeToDelete === currentTenant?.id) {
        const remainingTenants = tenants.filter(t => t.id !== storeToDelete);
        if (remainingTenants.length > 0) {
          onTenantChange(remainingTenants[0].id);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete store');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDaysRemaining = (trialEndsAt: string) => {
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const storeToDeleteName = tenants.find(t => t.id === storeToDelete)?.store_name || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Stores</h1>
          <p className="text-muted-foreground">Manage all your stores from one place</p>
        </div>
        <Button onClick={handleCreateStore}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Store
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((store) => {
          const isCurrentStore = store.id === currentTenant?.id;
          const daysRemaining = getDaysRemaining(store.trial_ends_at);
          const isExpired = store.plan === 'trial' && daysRemaining <= 0;

          return (
            <Card
              key={store.id}
              className={`relative transition-all ${
                isCurrentStore ? 'ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
            >
              {isCurrentStore && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary">
                    <Check className="w-3 h-3 mr-1" />
                    Current
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      store.business_type === 'grocery' 
                        ? 'bg-accent/10 text-accent' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {store.business_type === 'grocery' ? (
                        <Apple className="w-5 h-5" />
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {store.store_name}
                        {store.is_primary && (
                          <Star className="w-4 h-4 text-warning fill-warning" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        /store/{store.store_slug}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge variant={store.plan === 'pro' ? 'default' : isExpired ? 'destructive' : 'secondary'}>
                    {store.plan === 'pro' ? 'Pro' : isExpired ? 'Expired' : `Trial (${daysRemaining}d left)`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{store.business_type}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  {!isCurrentStore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSwitchStore(store.id)}
                    >
                      Switch to Store
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`/store/${store.store_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>

                  {tenants.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(store.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Store Card */}
        <Card
          className="border-dashed cursor-pointer hover:border-primary/50 transition-all"
          onClick={handleCreateStore}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-medium">Create New Store</p>
            <p className="text-xs text-center mt-1">Add another store to your account</p>
          </CardContent>
        </Card>
      </div>

      {/* First Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{storeToDeleteName}</strong>?
              This action will permanently remove all store data including products, orders, and customers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Confirmation Dialog with Type Confirmation */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Permanent Deletion</DialogTitle>
            <DialogDescription>
              This action <strong>cannot be undone</strong>. All data associated with{' '}
              <strong>{storeToDeleteName}</strong> will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 rounded-lg text-sm">
              <p className="font-medium text-destructive mb-2">The following will be deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All products and categories</li>
                <li>All orders and customer data</li>
                <li>All store settings and configurations</li>
                <li>All uploaded images and assets</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE' || isDeleting}
              onClick={handleFinalDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Store Permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
