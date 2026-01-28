import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

// Cache for profile/tenant to avoid redundant fetches
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  dataCache.set(key, { data, timestamp: Date.now() });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track if initial load is in progress to prevent duplicate fetches
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  // Optimized fetch functions with caching
  const fetchProfile = useCallback(async (userId: string, useCache = true): Promise<Profile | null> => {
    const cacheKey = `profile:${userId}`;
    
    if (useCache) {
      const cached = getCached<Profile>(cacheKey);
      if (cached) {
        setProfile(cached);
        return cached;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      const profileData = data as Profile;
      setCache(cacheKey, profileData);
      setProfile(profileData);
      return profileData;
    }
    return null;
  }, []);

  const fetchUserTenants = useCallback(async (useCache = true): Promise<Tenant[]> => {
    const cacheKey = 'tenants';
    
    if (useCache) {
      const cached = getCached<Tenant[]>(cacheKey);
      if (cached) {
        setTenants(cached);
        return cached;
      }
    }

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
      setCache(cacheKey, mappedTenants);
      setTenants(mappedTenants);
      return mappedTenants;
    }
    return [];
  }, []);

  const fetchTenant = useCallback(async (tenantId: string, useCache = true): Promise<Tenant | null> => {
    const cacheKey = `tenant:${tenantId}`;
    
    if (useCache) {
      const cached = getCached<Tenant>(cacheKey);
      if (cached) {
        setTenant(cached);
        return cached;
      }
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();
    
    if (!error && data) {
      const tenantData = data as Tenant;
      setCache(cacheKey, tenantData);
      setTenant(tenantData);
      return tenantData;
    }
    return null;
  }, []);

  // OPTIMIZED: Load all user data in PARALLEL
  const loadUserData = useCallback(async (userId: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      // Run profile and tenants fetch in PARALLEL
      const [profileData, userTenants] = await Promise.all([
        fetchProfile(userId),
        fetchUserTenants()
      ]);

      // Determine which tenant to load
      let tenantIdToLoad: string | null = null;

      if (profileData?.tenant_id) {
        tenantIdToLoad = profileData.tenant_id;
      } else if (userTenants.length > 0) {
        const primaryTenant = userTenants.find((t: Tenant) => t.is_primary) || userTenants[0];
        tenantIdToLoad = primaryTenant.id;
      }

      // Fetch tenant if we have an ID
      if (tenantIdToLoad) {
        await fetchTenant(tenantIdToLoad);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchProfile, fetchUserTenants, fetchTenant]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, false);
      if (profileData?.tenant_id) {
        await fetchTenant(profileData.tenant_id, false);
      }
      await fetchUserTenants(false);
    }
  }, [user, fetchProfile, fetchTenant, fetchUserTenants]);

  const refreshTenant = useCallback(async () => {
    if (profile?.tenant_id) {
      await fetchTenant(profile.tenant_id, false);
    }
  }, [profile?.tenant_id, fetchTenant]);

  const refreshTenants = useCallback(async () => {
    await fetchUserTenants(false);
  }, [fetchUserTenants]);

  const switchTenant = useCallback(async (tenantId: string) => {
    const { error } = await supabase.rpc('set_primary_tenant', { target_tenant_id: tenantId });
    
    if (!error) {
      // Clear cache and refresh
      dataCache.clear();
      await refreshProfile();
      await fetchTenant(tenantId, false);
      await fetchUserTenants(false);
    }
  }, [refreshProfile, fetchTenant, fetchUserTenants]);

  // Initialize auth state
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        loadUserData(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          // Clear cache on sign in
          dataCache.clear();
          loadUserData(newSession.user.id);
          
          // Dispatch custom event for useInstantAuth
          window.dispatchEvent(new Event('supabase-auth-change'));
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setTenant(null);
          setTenants([]);
          dataCache.clear();
          setLoading(false);
          
          // Dispatch custom event for useInstantAuth
          window.dispatchEvent(new Event('supabase-auth-change'));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
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
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
    setTenants([]);
    dataCache.clear();
  }, []);

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
