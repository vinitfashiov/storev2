import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'owner';
  tenant_id: string | null;
  onboarding_completed: boolean;
}

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  plan: 'trial' | 'pro';
  trial_ends_at: string;
  is_active: boolean;
  address: string | null;
  phone: string | null;
  is_primary?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  refreshTenants: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data as Profile);
      return data;
    }
    return null;
  };

  const fetchUserTenants = async () => {
    const { data, error } = await supabase.rpc('get_user_tenants');
    
    if (!error && data) {
      const mappedTenants = data.map((t: any) => ({
        id: t.id,
        store_name: t.store_name,
        store_slug: t.store_slug,
        business_type: t.business_type as 'ecommerce' | 'grocery',
        plan: t.plan as 'trial' | 'pro',
        trial_ends_at: t.trial_ends_at,
        is_active: t.is_active,
        address: null,
        phone: null,
        is_primary: t.is_primary
      }));
      setTenants(mappedTenants);
      return mappedTenants;
    }
    return [];
  };

  const fetchTenant = async (tenantId: string) => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();
    
    if (!error && data) {
      setTenant(data as Tenant);
      return data;
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData?.tenant_id) {
        await fetchTenant(profileData.tenant_id);
      }
      await fetchUserTenants();
    }
  };

  const refreshTenant = async () => {
    if (profile?.tenant_id) {
      await fetchTenant(profile.tenant_id);
    }
  };

  const refreshTenants = async () => {
    await fetchUserTenants();
  };

  const switchTenant = async (tenantId: string) => {
    const { error } = await supabase.rpc('set_primary_tenant', { target_tenant_id: tenantId });
    
    if (!error) {
      await fetchTenant(tenantId);
      await fetchUserTenants();
      // Update profile state with new tenant_id
      if (profile) {
        setProfile({ ...profile, tenant_id: tenantId });
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            const userTenants = await fetchUserTenants();
            
            if (profileData?.tenant_id) {
              await fetchTenant(profileData.tenant_id);
            } else if (userTenants.length > 0) {
              // If no tenant_id in profile but user has tenants, use the primary one
              const primaryTenant = userTenants.find((t: Tenant) => t.is_primary) || userTenants[0];
              await fetchTenant(primaryTenant.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
          setTenants([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(async (profileData) => {
          const userTenants = await fetchUserTenants();
          
          if (profileData?.tenant_id) {
            await fetchTenant(profileData.tenant_id);
          } else if (userTenants.length > 0) {
            const primaryTenant = userTenants.find((t: Tenant) => t.is_primary) || userTenants[0];
            await fetchTenant(primaryTenant.id);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
    setTenants([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      tenant,
      tenants,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      refreshTenant,
      refreshTenants,
      switchTenant
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
