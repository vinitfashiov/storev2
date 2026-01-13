import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  showLocationModal: boolean;
  setPincode: (pincode: string) => void;
  setLocality: (locality: string | null) => void;
  checkDeliverability: (tenantId: string) => Promise<boolean>;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  clearLocation: () => void;
}

const GroceryLocationContext = createContext<GroceryLocationContextType | undefined>(undefined);

const STORAGE_KEY_PINCODE = 'grocery_pincode';
const STORAGE_KEY_LOCALITY = 'grocery_locality';

export function GroceryLocationProvider({ children, tenantId }: { children: ReactNode; tenantId: string | null }) {
  const [pincode, setPincodeState] = useState<string>('');
  const [locality, setLocalityState] = useState<string | null>(null);
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea | null>(null);
  const [isDeliverable, setIsDeliverable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Load saved pincode from localStorage
  useEffect(() => {
    const savedPincode = localStorage.getItem(STORAGE_KEY_PINCODE);
    const savedLocality = localStorage.getItem(STORAGE_KEY_LOCALITY);
    
    if (savedPincode) {
      setPincodeState(savedPincode);
    }
    if (savedLocality) {
      setLocalityState(savedLocality);
    }
  }, []);

  // Check deliverability when pincode or tenantId changes
  useEffect(() => {
    if (tenantId && pincode && pincode.length === 6) {
      checkDeliverability(tenantId);
    } else if (!pincode) {
      setDeliveryArea(null);
      setIsDeliverable(false);
    }
  }, [tenantId, pincode]);

  const checkDeliverability = useCallback(async (tid: string): Promise<boolean> => {
    if (!pincode || pincode.length !== 6) {
      setIsDeliverable(false);
      setDeliveryArea(null);
      return false;
    }

    setIsLoading(true);
    try {
      const { data: areas } = await supabase
        .from('delivery_areas')
        .select('id, name, pincodes, localities, is_active')
        .eq('tenant_id', tid)
        .eq('is_active', true);

      if (areas && areas.length > 0) {
        // Find matching delivery area
        const matchedArea = areas.find(area => 
          area.pincodes && area.pincodes.includes(pincode)
        );

        if (matchedArea) {
          setDeliveryArea(matchedArea);
          setIsDeliverable(true);
          setIsLoading(false);
          return true;
        }
      }

      setDeliveryArea(null);
      setIsDeliverable(false);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error checking deliverability:', error);
      setIsDeliverable(false);
      setDeliveryArea(null);
      setIsLoading(false);
      return false;
    }
  }, [pincode]);

  const setPincode = useCallback((newPincode: string) => {
    // Only allow 6 digit numbers
    const sanitized = newPincode.replace(/\D/g, '').slice(0, 6);
    setPincodeState(sanitized);
    
    if (sanitized.length === 6) {
      localStorage.setItem(STORAGE_KEY_PINCODE, sanitized);
    } else if (sanitized.length === 0) {
      localStorage.removeItem(STORAGE_KEY_PINCODE);
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
