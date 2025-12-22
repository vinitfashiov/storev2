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
      // Check if phone already exists for this tenant
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tid)
        .eq('phone', phone)
        .maybeSingle();

      if (existingCustomer) {
        return { error: new Error('Phone number already registered') };
      }

      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, phone }
        }
      });

      if (error) return { error };

      if (data.user) {
        // Create customer record
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
          await supabase.auth.signOut();
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
    await supabase.auth.signOut();
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
