import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Image, Globe, Mail, Phone, MapPin, Loader2, Trash2, Store, Sparkles } from 'lucide-react';
import { StorefrontPWACard } from '@/components/pwa/StorefrontPWACard';

interface StoreSettings {
  tenant_id: string;
  website_title: string | null;
  website_description: string | null;
  logo_path: string | null;
  favicon_path: string | null;
  store_email: string | null;
  store_phone: string | null;
  store_address: string | null;
  show_header: boolean;
  show_footer: boolean;
}

interface AdminStoreSettingsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminStoreSettings({ tenantId, disabled }: AdminStoreSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [settings, setSettings] = useState<StoreSettings>({
    tenant_id: tenantId,
    website_title: '',
    website_description: '',
    logo_path: null,
    favicon_path: null,
    store_email: '',
    store_phone: '',
    store_address: '',
    show_header: true,
    show_footer: true,
  });

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    // Fetch tenant info
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('store_name, store_slug')
      .eq('id', tenantId)
      .single();

    if (tenantData) {
      setStoreName(tenantData.store_name);
      setStoreSlug(tenantData.store_slug);
    }

    // Fetch settings
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load store settings');
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        ...settings,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id' });

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully');
    }
    setSaving(false);
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error(`Failed to upload ${type}`);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      setSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_path' : 'favicon_path']: publicUrl
      }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    }

    if (type === 'logo') setUploadingLogo(false);
    else setUploadingFavicon(false);
  };

  const handleRemoveImage = (type: 'logo' | 'favicon') => {
    setSettings(prev => ({
      ...prev,
      [type === 'logo' ? 'logo_path' : 'favicon_path']: null
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Store Info */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Store className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    My Store Settings
                  </h1>
                  <p className="text-muted-foreground mt-1">{storeName}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Customize your storefront appearance, branding, and contact information. These settings help create a professional and trustworthy store experience.
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={disabled || saving}
              size="lg"
              className="shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Branding Card */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Branding</CardTitle>
                <CardDescription>Logo & Favicon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Store Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_path ? (
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-xl border-2 border-primary/20 overflow-hidden bg-muted/50 shadow-sm">
                      <img 
                        src={settings.logo_path} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      onClick={() => handleRemoveImage('logo')}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-28 h-28 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 group hover:border-primary/50 transition-colors">
                    <Image className="w-10 h-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    disabled={disabled || uploadingLogo}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={disabled || uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 512×512px, PNG or SVG</p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Favicon</Label>
              <div className="flex items-center gap-4">
                {settings.favicon_path ? (
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-lg border-2 border-primary/20 overflow-hidden bg-muted/50 shadow-sm">
                      <img 
                        src={settings.favicon_path} 
                        alt="Favicon" 
                        className="w-full h-full object-contain p-1.5"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      onClick={() => handleRemoveImage('favicon')}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 group hover:border-primary/50 transition-colors">
                    <Globe className="w-6 h-6 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="favicon-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'favicon');
                    }}
                    disabled={disabled || uploadingFavicon}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                    disabled={disabled || uploadingFavicon}
                  >
                    {uploadingFavicon ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Favicon
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 32×32px, ICO or PNG</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Info Card */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">SEO & Metadata</CardTitle>
                <CardDescription>Search engine optimization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website_title" className="text-base font-medium">Website Title</Label>
              <Input
                id="website_title"
                value={settings.website_title || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, website_title: e.target.value }))}
                placeholder="My Awesome Store"
                disabled={disabled}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Appears in browser tabs and search results</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_description" className="text-base font-medium">Website Description</Label>
              <Textarea
                id="website_description"
                value={settings.website_description || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, website_description: e.target.value }))}
                placeholder="A brief description of your store for search engines and social media..."
                rows={5}
                disabled={disabled}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Appears in search engine results (150-160 characters recommended)</p>
            </div>
          </CardContent>
        </Card>

        {/* Header/Footer Visibility */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Layout</CardTitle>
                <CardDescription>Show or hide default header/footer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Show Header</Label>
                <p className="text-xs text-muted-foreground">Toggle the default store header</p>
              </div>
              <Switch
                checked={settings.show_header}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_header: v }))}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Show Footer</Label>
                <p className="text-xs text-muted-foreground">Toggle the default store footer</p>
              </div>
              <Switch
                checked={settings.show_footer}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_footer: v }))}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="md:col-span-2 border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Contact Information</CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="store_email" className="text-base font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="store_email"
                  type="email"
                  value={settings.store_email || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_email: e.target.value }))}
                  placeholder="contact@store.com"
                  disabled={disabled}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_phone" className="text-base font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="store_phone"
                  type="tel"
                  value={settings.store_phone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  disabled={disabled}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_address" className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Input
                  id="store_address"
                  value={settings.store_address || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  placeholder="123 Store Street, City, State"
                  disabled={disabled}
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storefront PWA Card */}
        {storeSlug && (
          <StorefrontPWACard storeSlug={storeSlug} storeName={storeName} />
        )}
      </div>
    </div>
  );
}
