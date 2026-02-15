
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Store, ArrowLeft } from 'lucide-react';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { useToast } from '@/hooks/use-toast';
import { supabaseStore } from '@/integrations/supabase/storeClient';

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

export default function StoreLogin() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant: cdTenant, isCustomDomain } = useCustomDomain();
  const { signInWithOtp, verifyOtp, loading: authLoading } = useStoreAuth();

  // Use slug from params or context
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;

  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [tenant, setTenant] = useState<any>(null);

  const getLink = (path: string) => {
    if (!slug) return path;
    const cleanPath = path.startsWith('/') ? path : `/ ${path} `;
    return isCustomDomain ? cleanPath : `/ store / ${slug}${cleanPath} `;
  };

  useEffect(() => {
    const fetchTenant = async () => {
      if (isCustomDomain && cdTenant) {
        setTenant(cdTenant);
        return;
      }

      if (!slug) return;
      const { data } = await supabaseStore
        .from('tenants')
        .select('*')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setTenant(data);
      } else {
        navigate('/404'); // Or a generic error page
      }
    };

    fetchTenant();
  }, [slug, isCustomDomain, cdTenant, navigate]);

  if (authLoading || !tenant) return <LoginSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!otpSent) {
      // Send OTP
      const { error } = await signInWithOtp(phoneNumber, tenant.id);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
        setLoading(false);
        return;
      }
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code.',
      });
    } else {
      // Verify OTP
      const { error, data } = await verifyOtp(phoneNumber, otp, tenant.id);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Login Successful',
        description: 'You have been successfully logged in.',
      });

      // Check if the user has a profile
      if (data?.user?.id) {
        const { data: profile } = await supabaseStore
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (profile) {
          navigate(getLink('/account'));
        } else {
          // If not signed up, redirect to signup
          navigate(getLink('/signup'));
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to={getLink('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your {tenant?.store_name} account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  disabled={otpSent}
                />
              </div>
              {otpSent && (
                <div>
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    maxLength={6}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {otpSent ? 'Verifying...' : 'Sending OTP...'}</> : (otpSent ? 'Verify OTP' : 'Send OTP')}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to={getLink('/signup')} className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
