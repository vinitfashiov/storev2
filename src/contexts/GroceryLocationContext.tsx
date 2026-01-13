import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryArea {
  id: string;
  name: string;
  pincodes: string[];
  localities: string[] | null;
  is_active: boolean;
}

interface GroceryLocationContextType {
  pincode: string;
  locality: string | null;
  deliveryArea: DeliveryArea | null;
  isDeliverable: boolean;
  isLocationSet: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  showLocationModal: boolean;
  setPincode: (pincode: string) => void;
  setLocality: (locality: string | null) => void;
  checkDeliverability: (pincode: string, tenantId: string) => Promise<boolean>;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  clearLocation: () => void;
}

const GroceryLocationContext = createContext<GroceryLocationContextType | undefined>(undefined);

const STORAGE_KEY_PINCODE = 'grocery_pincode';
const STORAGE_KEY_LOCALITY = 'grocery_locality';
const STORAGE_KEY_DELIVERABLE = 'grocery_deliverable';
const STORAGE_KEY_AREA = 'grocery_area';

export function GroceryLocationProvider({ children, tenantId }: { children: ReactNode; tenantId: string | null }) {
  // Initialize state synchronously from localStorage
  const [pincode, setPincodeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_PINCODE) || '';
    }
    return '';
  });
  
  const [locality, setLocalityState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_LOCALITY) || null;
    }
    return null;
  });
  
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY_AREA);
      if (cached) {
        try { return JSON.parse(cached); } catch { return null; }
      }
    }
    return null;
  });
  
  const [isDeliverable, setIsDeliverable] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_DELIVERABLE) === 'true';
    }
    return false;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Track current check to prevent stale updates
  const checkIdRef = useRef(0);

  // Check deliverability function - accepts pincode as parameter to avoid stale closures
  const checkDeliverability = useCallback(async (checkPincode: string, tid: string): Promise<boolean> => {
    if (!checkPincode || checkPincode.length !== 6 || !tid) {
      setIsDeliverable(false);
      setDeliveryArea(null);
      localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
      localStorage.removeItem(STORAGE_KEY_AREA);
      return false;
    }

    // Increment check ID to track this specific check
    const currentCheckId = ++checkIdRef.current;
    setIsLoading(true);
    
    try {
      const { data: areas, error } = await supabase
        .from('delivery_areas')
        .select('id, name, pincodes, localities, is_active')
        .eq('tenant_id', tid)
        .eq('is_active', true);

      // If a newer check started, ignore this result
      if (currentCheckId !== checkIdRef.current) {
        return false;
      }

      if (error) {
        console.error('Error fetching delivery areas:', error);
        setIsDeliverable(false);
        setDeliveryArea(null);
        localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
        localStorage.removeItem(STORAGE_KEY_AREA);
        setIsLoading(false);
        return false;
      }

      if (areas && areas.length > 0) {
        const matchedArea = areas.find(area => 
          area.pincodes && area.pincodes.includes(checkPincode)
        );

        if (matchedArea) {
          setDeliveryArea(matchedArea);
          setIsDeliverable(true);
          localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'true');
          localStorage.setItem(STORAGE_KEY_AREA, JSON.stringify(matchedArea));
          setIsLoading(false);
          return true;
        }
      }

      // No match found
      setDeliveryArea(null);
      setIsDeliverable(false);
      localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
      localStorage.removeItem(STORAGE_KEY_AREA);
      setIsLoading(false);
      return false;
      
    } catch (error) {
      console.error('Error checking deliverability:', error);
      
      if (currentCheckId === checkIdRef.current) {
        setIsDeliverable(false);
        setDeliveryArea(null);
        localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
        localStorage.removeItem(STORAGE_KEY_AREA);
        setIsLoading(false);
      }
      return false;
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    const initializeLocation = async () => {
      if (tenantId && pincode && pincode.length === 6) {
        // Always verify cached deliverability on mount
        await checkDeliverability(pincode, tenantId);
      } else if (!pincode || pincode.length !== 6) {
        // No valid pincode - clear deliverable state
        setIsDeliverable(false);
        setDeliveryArea(null);
      }
      setIsInitialized(true);
    };
    
    if (tenantId) {
      initializeLocation();
    }
  }, [tenantId, checkDeliverability]);

  // Re-check when pincode changes after initialization
  useEffect(() => {
    if (!isInitialized || !tenantId) return;
    
    if (pincode && pincode.length === 6) {
      checkDeliverability(pincode, tenantId);
    } else {
      // Clear deliverability when pincode is cleared or incomplete
      setDeliveryArea(null);
      setIsDeliverable(false);
      localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
      localStorage.removeItem(STORAGE_KEY_AREA);
    }
  }, [pincode, tenantId, isInitialized, checkDeliverability]);

  const setPincode = useCallback((newPincode: string) => {
    const sanitized = newPincode.replace(/\D/g, '').slice(0, 6);
    setPincodeState(sanitized);
    
    if (sanitized.length === 6) {
      localStorage.setItem(STORAGE_KEY_PINCODE, sanitized);
    } else {
      localStorage.removeItem(STORAGE_KEY_PINCODE);
      // Also clear deliverability when pincode is incomplete
      localStorage.setItem(STORAGE_KEY_DELIVERABLE, 'false');
      localStorage.removeItem(STORAGE_KEY_AREA);
    }
  }, []);

  const setLocality = useCallback((newLocality: string | null) => {
    setLocalityState(newLocality);
    if (newLocality) {
      localStorage.setItem(STORAGE_KEY_LOCALITY, newLocality);
    } else {
      localStorage.removeItem(STORAGE_KEY_LOCALITY);
    }
  }, []);

  const openLocationModal = useCallback(() => {
    setShowLocationModal(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  const clearLocation = useCallback(() => {
    setPincodeState('');
    setLocalityState(null);
    setDeliveryArea(null);
    setIsDeliverable(false);
    localStorage.removeItem(STORAGE_KEY_PINCODE);
    localStorage.removeItem(STORAGE_KEY_LOCALITY);
    localStorage.removeItem(STORAGE_KEY_DELIVERABLE);
    localStorage.removeItem(STORAGE_KEY_AREA);
  }, []);

  const isLocationSet = pincode.length === 6;

  return (
    <GroceryLocationContext.Provider
      value={{
        pincode,
        locality,
        deliveryArea,
        isDeliverable,
        isLocationSet,
        isLoading,
        isInitialized,
        showLocationModal,
        setPincode,
        setLocality,
        checkDeliverability,
        openLocationModal,
        closeLocationModal,
        clearLocation
      }}
    >
      {children}
    </GroceryLocationContext.Provider>
  );
}

export function useGroceryLocation() {
  const context = useContext(GroceryLocationContext);
  if (!context) {
    throw new Error('useGroceryLocation must be used within a GroceryLocationProvider');
  }
  return context;
}
