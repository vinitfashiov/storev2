import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Store, ArrowLeft, Phone, User, KeyRound, ArrowRight } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface StoreAuthProps {
  tenantId: string;
  storeName: string;
}

type AuthStep = 'phone' | 'otp' | 'name';

const AuthSkeleton = () => (
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
            <div className="w-20 h-4 bg-muted rounded animate-pulse" />
            <div className="w-full h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-full h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export default function StoreAuth({ tenantId, storeName }: StoreAuthProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { refreshCustomer, loading: authLoading } = useStoreAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (authLoading) return <AuthSkeleton />;

  const cleanPhone = (p: string) => p.replace(/\D/g, '').replace(/^91/, '');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhone(phone);
    
    if (cleaned.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists
      const { data: checkData, error: checkError } = await supabase.functions.invoke('store-customer-otp', {
        body: { action: 'check', phone: cleaned, tenantId }
      });

      if (checkError) throw checkError;

      setIsNewUser(!checkData.exists);

      // Send OTP
      const { data: sendData, error: sendError } = await supabase.functions.invoke('store-customer-otp', {
        body: { action: 'send', phone: cleaned, tenantId }
      });

      if (sendError) throw sendError;

      if (sendData.error) {
        toast.error(sendData.error);
        setLoading(false);
        return;
      }

      toast.success('OTP sent to your phone');
      setStep('otp');
      setCountdown(30);
    } catch (error: any) {
      console.error('Phone submit error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('store-customer-otp', {
        body: { 
          action: 'verify', 
          phone: cleanPhone(phone), 
          otp, 
          tenantId,
          name: isNewUser ? null : undefined // For existing users, don't send name
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (data.action === 'need_name') {
        // New user, need to collect name
        setStep('name');
        setLoading(false);
        return;
      }

      // Login with the provided credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      await refreshCustomer();
      
      toast.success(data.action === 'signup' ? 'Account created successfully!' : 'Logged in successfully!');
      navigate(`/store/${slug}`);
    } catch (error: any) {
      console.error('OTP verify error:', error);
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('store-customer-otp', {
        body: { 
          action: 'verify', 
          phone: cleanPhone(phone), 
          otp, 
          tenantId,
          name: name.trim()
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      // Login with the provided credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      await refreshCustomer();
      
      toast.success('Account created successfully!');
      navigate(`/store/${slug}`);
    } catch (error: any) {
      console.error('Name submit error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('store-customer-otp', {
        body: { action: 'send', phone: cleanPhone(phone), tenantId }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('OTP resent successfully');
      setCountdown(30);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'name') {
      setStep('otp');
      setName('');
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'phone': return <Phone className="w-6 h-6 text-primary-foreground" />;
      case 'otp': return <KeyRound className="w-6 h-6 text-primary-foreground" />;
      case 'name': return <User className="w-6 h-6 text-primary-foreground" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return 'Enter your phone number';
      case 'otp': return 'Verify OTP';
      case 'name': return 'Almost there!';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'phone': return `Sign in or create account for ${storeName}`;
      case 'otp': return `Enter the 6-digit code sent to +91 ${cleanPhone(phone)}`;
      case 'name': return 'Enter your name to complete signup';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'phone' ? (
          <Link to={`/store/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </Link>
        ) : (
          <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        )}
        
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              {getStepIcon()}
            </div>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center px-3 bg-muted rounded-md text-muted-foreground text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {step === 'name' && (
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                  ) : (
                    'Complete Signup'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}