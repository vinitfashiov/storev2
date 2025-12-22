import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Image, Globe, Mail, Phone, MapPin, Loader2, Trash2 } from 'lucide-react';

interface StoreSettings {
  tenant_id: string;
  website_title: string | null;
  website_description: string | null;
  logo_path: string | null;
  favicon_path: string | null;
  store_email: string | null;
  store_phone: string | null;
  store_address: string | null;
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
  const [settings, setSettings] = useState<StoreSettings>({
    tenant_id: tenantId,
    website_title: '',
    website_description: '',
    logo_path: null,
    favicon_path: null,
    store_email: '',
    store_phone: '',
    store_address: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [tenantId]);

  const fetchSettings = async () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Customize your storefront appearance and contact info</p>
        </div>
        <Button onClick={handleSave} disabled={disabled || saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Branding
            </CardTitle>
            <CardDescription>Upload your store logo and favicon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Store Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_path ? (
                  <div className="relative group">
                    <img 
                      src={settings.logo_path} 
                      alt="Logo" 
                      className="w-24 h-24 object-contain rounded-lg border bg-muted"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage('logo')}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
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
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={disabled || uploadingLogo}
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 512x512px</p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                {settings.favicon_path ? (
                  <div className="relative group">
                    <img 
                      src={settings.favicon_path} 
                      alt="Favicon" 
                      className="w-12 h-12 object-contain rounded border bg-muted"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage('favicon')}
                      disabled={disabled}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-12 h-12 border-2 border-dashed rounded flex items-center justify-center bg-muted/50">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
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
                    size="sm"
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                    disabled={disabled || uploadingFavicon}
                  >
                    {uploadingFavicon ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Favicon
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 32x32px</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Website Info
            </CardTitle>
            <CardDescription>SEO title and description for your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website_title">Website Title</Label>
              <Input
                id="website_title"
                value={settings.website_title || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, website_title: e.target.value }))}
                placeholder="My Awesome Store"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_description">Website Description</Label>
              <Textarea
                id="website_description"
                value={settings.website_description || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, website_description: e.target.value }))}
                placeholder="A brief description of your store for search engines..."
                rows={4}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
            <CardDescription>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="store_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="store_email"
                  type="email"
                  value={settings.store_email || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_email: e.target.value }))}
                  placeholder="contact@store.com"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  id="store_phone"
                  type="tel"
                  value={settings.store_phone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Input
                  id="store_address"
                  value={settings.store_address || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  placeholder="123 Store Street, City"
                  disabled={disabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
