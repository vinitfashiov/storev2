import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, Loader2, Image, GripVertical, Monitor, Smartphone, Layers } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_path: string;
  cta_text: string | null;
  cta_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
  device_type: 'desktop' | 'mobile' | 'all';
}

interface AdminStoreBannersProps {
  tenantId: string;
  disabled?: boolean;
}

const emptyBanner: Omit<Banner, 'id'> = {
  title: '',
  subtitle: '',
  image_path: '',
  cta_text: '',
  cta_url: '',
  is_active: true,
  position: 0,
  starts_at: null,
  ends_at: null,
  device_type: 'all',
};

export default function AdminStoreBanners({ tenantId, disabled }: AdminStoreBannersProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<Omit<Banner, 'id'>>(emptyBanner);

  useEffect(() => {
    fetchBanners();
  }, [tenantId]);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('store_banners')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } else {
      setBanners((data as any) || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/banners/banner-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload image');
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, image_path: publicUrl }));
      toast.success('Image uploaded successfully');
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    // Title is now optional
    // if (!form.title.trim()) {
    //   toast.error('Title is required');
    //   return;
    // }
    if (!form.image_path) {
      toast.error('Please upload an image');
      return;
    }

    setSaving(true);
    if (editingBanner) {
      const { error } = await supabase
        .from('store_banners')
        .update({ ...form })
        .eq('id', editingBanner.id);

      if (error) {
        toast.error('Failed to update banner');
      } else {
        toast.success('Banner updated');
        fetchBanners();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('store_banners')
        .insert({
          ...form,
          tenant_id: tenantId,
          position: banners.length,
        });

      if (error) {
        toast.error('Failed to create banner');
      } else {
        toast.success('Banner created');
        fetchBanners();
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image_path: banner.image_path,
      cta_text: banner.cta_text,
      cta_url: banner.cta_url,
      is_active: banner.is_active,
      position: banner.position,
      starts_at: banner.starts_at,
      ends_at: banner.ends_at,
      device_type: banner.device_type || 'all',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('store_banners')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete banner');
    } else {
      toast.success('Banner deleted');
      fetchBanners();
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    setForm(emptyBanner);
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('store_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (error) {
      toast.error('Failed to update banner');
    } else {
      fetchBanners();
    }
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
          <h1 className="text-2xl font-display font-bold">Store Banners</h1>
          <p className="text-muted-foreground">Manage hero banners for your storefront</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {banners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No banners yet. Create your first banner!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <img
                        src={banner.image_path}
                        alt={banner.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banner.title}</p>
                        {banner.subtitle && (
                          <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {banner.cta_text ? (
                        <span className="text-sm">{banner.cta_text}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={() => toggleActive(banner)}
                          disabled={disabled}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(banner)}
                          disabled={disabled}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(banner.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Device Type Selection */}
            <div className="space-y-3">
              <Label>Device Target</Label>
              <RadioGroup
                value={form.device_type}
                onValueChange={(value) => setForm(prev => ({ ...prev, device_type: value as any }))}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="all" id="all" className="peer sr-only" />
                  <Label
                    htmlFor="all"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Layers className="mb-2 h-6 w-6" />
                    All Devices
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="desktop" id="desktop" className="peer sr-only" />
                  <Label
                    htmlFor="desktop"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Monitor className="mb-2 h-6 w-6" />
                    Desktop
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="mobile" id="mobile" className="peer sr-only" />
                  <Label
                    htmlFor="mobile"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Smartphone className="mb-2 h-6 w-6" />
                    Mobile
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Banner Image *</Label>
              <div className="flex flex-col gap-4">
                {form.image_path ? (
                  <img
                    src={form.image_path}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload banner image</p>
                    </div>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="banner-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {form.image_path ? 'Change Image' : 'Upload Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.device_type === 'mobile'
                      ? 'Recommended: 800x1200px (Portrait)'
                      : 'Recommended: 1920x600px (Landscape)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summer Sale!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={form.subtitle || ''}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Up to 50% off on selected items"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta_text">Button Text</Label>
                <Input
                  id="cta_text"
                  value={form.cta_text || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, cta_text: e.target.value }))}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta_url">Button Link</Label>
                <Input
                  id="cta_url"
                  value={form.cta_url || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, cta_url: e.target.value }))}
                  placeholder="/products"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingBanner ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
