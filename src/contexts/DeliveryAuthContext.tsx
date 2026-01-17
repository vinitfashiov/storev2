import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DeliveryBoy {
  id: string;
  full_name: string;
  mobile_number: string;
  payment_type: 'monthly_salary' | 'fixed_per_order' | 'percentage_per_order';
  wallet_balance: number;
  total_earned: number;
  total_paid: number;
}

interface SessionData {
  token: string;
  expires_at: string;
}

interface Tenant {
  id: string;
  store_name: string;
}

interface DeliveryArea {
  id: string;
  name: string;
  pincodes: string[];
}

interface DeliveryAuthContextType {
  deliveryBoy: DeliveryBoy | null;
  tenant: Tenant | null;
  assignedAreas: DeliveryArea[];
  loading: boolean;
  sessionToken: string | null;
  login: (mobile: string, password: string, storeSlug: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshData: () => Promise<void>;
  isSessionValid: () => boolean;
}

const DeliveryAuthContext = createContext<DeliveryAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'delivery_boy_session';

export function DeliveryAuthProvider({ children, storeSlug }: { children: ReactNode; storeSlug: string }) {
  const [deliveryBoy, setDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [assignedAreas, setAssignedAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem(`${STORAGE_KEY}_${storeSlug}`);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Check if session is expired
        if (session.expires_at && new Date(session.expires_at) > new Date()) {
          setDeliveryBoy(session.delivery_boy);
          setTenant(session.tenant);
          setAssignedAreas(session.assigned_areas || []);
          setSessionData({ token: session.token, expires_at: session.expires_at });
        } else {
          // Session expired, clear it
          localStorage.removeItem(`${STORAGE_KEY}_${storeSlug}`);
        }
      } catch (e) {
        localStorage.removeItem(`${STORAGE_KEY}_${storeSlug}`);
      }
    }
    setLoading(false);
  }, [storeSlug]);

  const login = async (mobile: string, password: string, slug: string): Promise<{ error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delivery-boy-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'login',
            mobile_number: mobile,
            password,
            store_slug: slug,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Login failed' };
      }

      // Store session with token
      localStorage.setItem(`${STORAGE_KEY}_${slug}`, JSON.stringify(data));
      setDeliveryBoy(data.delivery_boy);
      setTenant(data.tenant);
      setAssignedAreas(data.assigned_areas || []);
      setSessionData({ token: data.token, expires_at: data.expires_at });

      return {};
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: 'Failed to connect. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(`${STORAGE_KEY}_${storeSlug}`);
    setDeliveryBoy(null);
    setTenant(null);
    setAssignedAreas([]);
    setSessionData(null);
  };

  const refreshData = async () => {
    if (!deliveryBoy || !storeSlug) return;
    
    // Re-login to refresh data
    const stored = localStorage.getItem(`${STORAGE_KEY}_${storeSlug}`);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.expires_at && new Date(session.expires_at) > new Date()) {
          setDeliveryBoy(session.delivery_boy);
          setTenant(session.tenant);
          setAssignedAreas(session.assigned_areas || []);
          setSessionData({ token: session.token, expires_at: session.expires_at });
        } else {
          // Session expired
          logout();
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  const isSessionValid = (): boolean => {
    if (!sessionData) return false;
    return new Date(sessionData.expires_at) > new Date();
  };

  return (
    <DeliveryAuthContext.Provider value={{
      deliveryBoy,
      tenant,
      assignedAreas,
      loading,
      sessionToken: sessionData?.token || null,
      login,
      logout,
      refreshData,
      isSessionValid,
    }}>
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth() {
  const context = useContext(DeliveryAuthContext);
  if (!context) {
    throw new Error('useDeliveryAuth must be used within a DeliveryAuthProvider');
  }
  return context;
}
