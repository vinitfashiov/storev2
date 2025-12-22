import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface StoreAccountProps {
  storeName: string;
}

export default function StoreAccount({ storeName }: StoreAccountProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { customer, signOut } = useStoreAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate(`/store/${slug}`);
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Please log in to view your account</p>
            <Link to={`/store/${slug}/login`}>
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to={`/store/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>

        <h1 className="text-2xl font-display font-bold mb-6">My Account</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{customer.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{customer.email}</span>
              </div>
            </CardContent>
          </Card>

          <Link to={`/store/${slug}/account/orders`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium">My Orders</span>
                </div>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </CardContent>
            </Card>
          </Link>

          <Link to={`/store/${slug}/account/addresses`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">Saved Addresses</span>
                </div>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </CardContent>
            </Card>
          </Link>

          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
