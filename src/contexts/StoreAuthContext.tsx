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
  signUp: (phone: string, password: string, name: string, tenantId: string, email?: string) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string, tenantId: string) => Promise<{ error: Error | null }>;
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

  // Clean phone number to 10 digits
  const cleanPhone = (phone: string) => phone.replace(/\D/g, '').slice(-10);

  // Generate email from phone for Supabase auth (phone as identifier)
  const phoneToEmail = (phone: string, tid: string) => `${cleanPhone(phone)}@store.${tid}.local`;

  const signUp = async (phone: string, password: string, name: string, tid: string, customerEmail?: string) => {
    try {
      const cleanedPhone = cleanPhone(phone);
      
      if (cleanedPhone.length !== 10) {
        return { error: new Error('Please enter a valid 10-digit phone number') };
      }

      // Check if phone already exists for this tenant
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tid)
        .eq('phone', cleanedPhone)
        .maybeSingle();

      if (existingCustomer) {
        return { error: new Error('Phone number already registered. Please login instead.') };
      }

      const email = customerEmail || phoneToEmail(cleanedPhone, tid);
      const redirectUrl = `${window.location.origin}/`;
      
      // Try to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, phone: cleanedPhone }
        }
      });

      // If user already exists, try to sign in
      if (error?.message?.includes('User already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          return { error: new Error('Account exists with different password') };
        }

        if (signInData.user) {
          const { error: customerError } = await supabase.from('customers').insert({
            tenant_id: tid,
            user_id: signInData.user.id,
            name,
            phone: cleanedPhone,
            email: email // Use the email we signed up with
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
        const { error: customerError } = await supabase.from('customers').insert({
          tenant_id: tid,
          user_id: data.user.id,
          name,
          phone: cleanedPhone,
          email: email // Use the email we signed up with
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

  const signIn = async (phone: string, password: string, tid: string) => {
    try {
      const cleanedPhone = cleanPhone(phone);
      
      if (cleanedPhone.length !== 10) {
        return { error: new Error('Please enter a valid 10-digit phone number') };
      }

      // Check if customer exists for this tenant
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tid)
        .eq('phone', cleanedPhone)
        .maybeSingle();

      if (!existingCustomer) {
        return { error: new Error('No account found with this phone number. Please sign up first.') };
      }

      const email = (existingCustomer.email && existingCustomer.email.includes('@')) 
        ? existingCustomer.email 
        : phoneToEmail(cleanedPhone, tid);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Incorrect password') };
        }
        return { error };
      }

      if (data.user) {
        setCustomer(existingCustomer as Customer);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    // Sign out from Supabase auth completely
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
