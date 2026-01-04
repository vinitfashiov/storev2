import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Store, ShoppingCart, Apple, MapPin, Phone, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { z } from 'zod';

const slugSchema = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

const storeNameSchema = z.string()
  .min(2, 'Store name must be at least 2 characters')
  .max(100, 'Store name must be less than 100 characters');

type BusinessType = 'ecommerce' | 'grocery';

interface FormData {
  storeName: string;
  storeSlug: string;
  businessType: BusinessType;
  address: string;
  phone: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAddingNewStore = searchParams.get('new') === 'true';
  const { user, profile, refreshProfile, tenants } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    storeSlug: '',
    businessType: 'ecommerce',
    address: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/authentication');
    } else if (profile?.onboarding_completed && !isAddingNewStore) {
      // Only redirect if not adding a new store
      navigate('/dashboard');
    }
  }, [user, profile, navigate, isAddingNewStore]);

  useEffect(() => {
    const checkSlug = async () => {
      if (formData.storeSlug.length < 3) {
        setSlugAvailable(null);
        return;
      }

      try {
        slugSchema.parse(formData.storeSlug);
      } catch {
        setSlugAvailable(false);
        return;
      }

      setIsCheckingSlug(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('store_slug', formData.storeSlug)
        .maybeSingle();
      
      setSlugAvailable(!data && !error);
      setIsCheckingSlug(false);
    };

    const debounce = setTimeout(checkSlug, 500);
    return () => clearTimeout(debounce);
  }, [formData.storeSlug]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  const handleStoreNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      storeName: value,
      storeSlug: generateSlug(value)
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      try {
        storeNameSchema.parse(formData.storeName);
        slugSchema.parse(formData.storeSlug);
        if (!slugAvailable) {
          toast.error('This store URL is already taken');
          return;
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          toast.error(err.errors[0].message);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const isFirstStore = tenants.length === 0;
      
      // For additional stores, unset all existing is_primary flags first
      if (!isFirstStore) {
        await supabase
          .from('user_tenants')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          store_name: formData.storeName,
          store_slug: formData.storeSlug,
          business_type: formData.businessType,
          address: formData.address || null,
          phone: formData.phone || null,
          plan: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.message.includes('duplicate')) {
          toast.error('This store URL is already taken');
        } else {
          toast.error('Failed to create store. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Create user_tenants entry with is_primary = true for the new store
      const { error: userTenantError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          is_primary: true
        });

      if (userTenantError) {
        console.error('Failed to create user_tenants entry:', userTenantError);
        toast.error('Failed to link store to your account.');
        setIsLoading(false);
        return;
      }

      // Update profile with tenant_id and onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tenant_id: tenant.id,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (profileError) {
        toast.error('Failed to complete setup. Please try again.');
        setIsLoading(false);
        return;
      }

      await refreshProfile();
      toast.success(isFirstStore ? 'Store created successfully!' : 'New store added successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }

    setIsLoading(false);
  };

  const steps = [
    { number: 1, title: 'Store Info' },
    { number: 2, title: 'Business Type' },
    { number: 3, title: 'Details' }
  ];

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isAddingNewStore ? 'Add New Store' : 'Set Up Your Store'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAddingNewStore 
              ? 'Create another store under your account' 
              : "Let's get your online store ready in 3 simple steps"
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all duration-300
                ${step >= s.number 
                  ? 'gradient-primary text-primary-foreground shadow-glow' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step > s.number ? <Check className="w-5 h-5" /> : s.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                  step > s.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">{steps[step - 1].title}</CardTitle>
            <CardDescription>
              {step === 1 && "Choose a name and URL for your store"}
              {step === 2 && "What type of business are you running?"}
              {step === 3 && "Add your business contact details (optional)"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    placeholder="My Awesome Store"
                    value={formData.storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-slug">Store URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/store/</span>
                    <div className="relative flex-1">
                      <Input
                        id="store-slug"
                        placeholder="my-awesome-store"
                        value={formData.storeSlug}
                        onChange={(e) => setFormData(prev => ({ ...prev, storeSlug: e.target.value.toLowerCase() }))}
                        className={slugAvailable === false ? 'border-destructive' : slugAvailable === true ? 'border-success' : ''}
                      />
                      {isCheckingSlug && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {!isCheckingSlug && slugAvailable === true && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                      )}
                    </div>
                  </div>
                  {slugAvailable === false && formData.storeSlug.length >= 3 && (
                    <p className="text-sm text-destructive">This URL is not available</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <RadioGroup
                value={formData.businessType}
                onValueChange={(value: BusinessType) => setFormData(prev => ({ ...prev, businessType: value }))}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="ecommerce" id="ecommerce" className="peer sr-only" />
                  <Label
                    htmlFor="ecommerce"
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <ShoppingCart className="w-10 h-10 mb-3 text-primary" />
                    <span className="font-medium">E-Commerce</span>
                    <span className="text-xs text-muted-foreground mt-1">Sell products online</span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="grocery" id="grocery" className="peer sr-only" />
                  <Label
                    htmlFor="grocery"
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <Apple className="w-10 h-10 mb-3 text-accent" />
                    <span className="font-medium">Grocery</span>
                    <span className="text-xs text-muted-foreground mt-1">Sell groceries & essentials</span>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, Country"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                  <p className="text-sm text-info font-medium">🎉 7-Day Free Trial</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your store will start with a free 7-day trial. Upgrade anytime to continue.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Store...
                    </>
                  ) : (
                    <>
                      Launch Store
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
