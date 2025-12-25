import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  email: string;
  user_id: string;
}

interface StoreAuthContextType {
  user: User | null;
  session: Session | null;
  customer: Customer | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string, tenantId: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, tenantId: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const StoreAuthContext = createContext<StoreAuthContextType | undefined>(undefined);

export function StoreAuthProvider({ children, tenantId }: { children: ReactNode; tenantId: string | null }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async (userId: string, tid: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tid)
      .maybeSingle();
    
    if (data) {
      setCustomer(data as Customer);
    } else {
      setCustomer(null);
    }
  };

  const refreshCustomer = async () => {
    if (user && tenantId) {
      await fetchCustomer(user.id, tenantId);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && tenantId) {
        setTimeout(() => {
          fetchCustomer(session.user.id, tenantId);
        }, 0);
      } else {
        setCustomer(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && tenantId) {
        fetchCustomer(session.user.id, tenantId).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [tenantId]);

  const signUp = async (email: string, password: string, name: string, phone: string, tid: string) => {
    try {
      // Check if email already exists for THIS tenant (same store)
      const { data: existingEmailCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tid)
        .eq('email', email)
        .maybeSingle();

      if (existingEmailCustomer) {
        return { error: new Error('Email already registered for this store. Please login instead.') };
      }

      // Check if phone already exists for this tenant
      if (phone) {
        const { data: existingPhoneCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('tenant_id', tid)
          .eq('phone', phone)
          .maybeSingle();

        if (existingPhoneCustomer) {
          return { error: new Error('Phone number already registered for this store') };
        }
      }

      const redirectUrl = `${window.location.origin}/`;
      
      // Try to sign up - this creates a new auth.user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, phone }
        }
      });

      // If user already exists in auth.users (from another storefront), try to sign in instead
      if (error?.message?.includes('User already registered')) {
        // User exists in auth.users but not in this tenant's customers
        // Sign them in and create a customer record for this tenant
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          return { error: new Error('Account exists with different password. Please use the correct password or reset it.') };
        }

        if (signInData.user) {
          // Create customer record for this tenant
          const { error: customerError } = await supabase.from('customers').insert({
            tenant_id: tid,
            user_id: signInData.user.id,
            name,
            phone,
            email
          });

          if (customerError) {
            console.error('Failed to create customer:', customerError);
            return { error: new Error('Failed to create account for this store') };
          }

          await fetchCustomer(signInData.user.id, tid);
        }

        return { error: null };
      }

      if (error) return { error };

      if (data.user) {
        // Create customer record for this tenant
        const { error: customerError } = await supabase.from('customers').insert({
          tenant_id: tid,
          user_id: data.user.id,
          name,
          phone,
          email
        });

        if (customerError) {
          console.error('Failed to create customer:', customerError);
          return { error: new Error('Failed to create account') };
        }

        await fetchCustomer(data.user.id, tid);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string, tid: string) => {
    try {
      // Get current session first to check if already logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If already logged in with same email, just check customer record
      if (sessionData.session?.user?.email === email) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .eq('tenant_id', tid)
          .maybeSingle();

        if (!customerData) {
          return { error: new Error('No account found for this store. Please sign up first.') };
        }

        setCustomer(customerData as Customer);
        return { error: null };
      }

      // Otherwise do fresh login (but store admin session key first)
      const adminSessionKey = `admin_session_backup`;
      if (sessionData.session) {
        localStorage.setItem(adminSessionKey, JSON.stringify(sessionData.session));
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      if (data.user) {
        // Check if user is a customer of this tenant
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('tenant_id', tid)
          .maybeSingle();

        if (!customerData) {
          // Don't sign out - just return error
          return { error: new Error('No account found for this store. Please sign up first.') };
        }

        setCustomer(customerData as Customer);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    // Only clear customer state - don't sign out from Supabase auth
    // This preserves admin session if they were logged in
    setUser(null);
    setSession(null);
    setCustomer(null);
  };

  return (
    <StoreAuthContext.Provider value={{ user, session, customer, loading, signUp, signIn, signOut, refreshCustomer }}>
      {children}
    </StoreAuthContext.Provider>
  );
}

export function useStoreAuth() {
  const context = useContext(StoreAuthContext);
  if (!context) {
    throw new Error('useStoreAuth must be used within a StoreAuthProvider');
  }
  return context;
}
