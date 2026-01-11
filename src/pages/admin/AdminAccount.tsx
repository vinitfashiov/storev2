import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Phone, Mail, Store, Calendar, Shield, Camera, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAccount() {
  const { user, profile, tenant, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Extract phone from email (format: 9876543210@phone.storekriti.com)
  const phoneNumber = user?.email?.replace('@phone.storekriti.com', '') || '';
  const isPhoneAuth = user?.email?.endsWith('@phone.storekriti.com');

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
    // Fetch avatar from user metadata or storage
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [profile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Avatar storage not configured. Contact support.');
          return;
        }
        throw uploadError;
      }

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl.publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl.publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update user metadata
      await supabase.auth.updateUser({
        data: { name: name.trim() }
      });

      await refreshProfile();
      toast.success('Account updated successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">Manage your account settings and profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {getInitials(name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <label 
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div>
                <p className="font-medium">{name || 'No name set'}</p>
                <p className="text-sm text-muted-foreground">Store Owner</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">+91</span>
                <span>{isPhoneAuth ? phoneNumber : 'Not set'}</span>
                {isPhoneAuth && (
                  <span className="ml-auto text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
            </div>

            {/* Email (if applicable) */}
            {!isPhoneAuth && user?.email && (
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={isLoading} className="w-full">
              {isLoading ? (
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
          </CardContent>
        </Card>

        {/* Store & Account Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Current Store
              </CardTitle>
              <CardDescription>Your active store details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{tenant?.store_name}</p>
                  <p className="text-sm text-muted-foreground">/{tenant?.store_slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Business Type</p>
                  <p className="font-medium capitalize">{tenant?.business_type}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium capitalize">{tenant?.plan}</p>
                </div>
              </div>

              {tenant?.plan === 'trial' && tenant?.trial_ends_at && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Trial ends {format(new Date(tenant.trial_ends_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Security
              </CardTitle>
              <CardDescription>Your account is secured with OTP verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Phone OTP Login</span>
                </div>
                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Member since</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {user?.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Last sign in</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy h:mm a') : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
