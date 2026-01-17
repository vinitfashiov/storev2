import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Store, ArrowLeft } from 'lucide-react';

interface StoreLoginProps {
  tenantId: string;
  storeName: string;
}

// Loading skeleton for login page
const LoginSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <div className="w-24 h-4 bg-muted rounded animate-pulse" />
      </div>
      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-xl animate-pulse" />
          <div className="w-32 h-6 bg-muted rounded animate-pulse" />
          <div className="w-48 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-4 bg-muted rounded animate-pulse" />
            <div className="w-full h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="w-16 h-4 bg-muted rounded animate-pulse" />
            <div className="w-full h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-full h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export default function StoreLogin({ tenantId, storeName }: StoreLoginProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useStoreAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ phone: '', password: '' });

  if (authLoading) return <LoginSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(form.phone, form.password, tenantId);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Logged in successfully!');
    // Navigate to store - use slug if available, otherwise go to root (for custom domains)
    navigate(slug ? `/store/${slug}` : '/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to={slug ? `/store/${slug}` : '/'} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your {storeName} account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to={slug ? `/store/${slug}/signup` : '/signup'} className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
