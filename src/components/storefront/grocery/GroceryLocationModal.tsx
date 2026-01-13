import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';
import { useGroceryLocation } from '@/contexts/GroceryLocationContext';

interface GroceryLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onDeliverableChange?: (isDeliverable: boolean) => void;
}

export function GroceryLocationModal({
  open,
  onOpenChange,
  tenantId,
  onDeliverableChange
}: GroceryLocationModalProps) {
  const { 
    pincode, 
    setPincode, 
    checkDeliverability, 
    isLoading,
    deliveryArea 
  } = useGroceryLocation();
  
  const [localPincode, setLocalPincode] = useState(pincode);
  const [checked, setChecked] = useState(false);
  const [isDeliverable, setIsDeliverableLocal] = useState(false);

  const handleCheck = async () => {
    if (localPincode.length !== 6) return;
    
    setPincode(localPincode);
    const result = await checkDeliverability(tenantId);
    setChecked(true);
    setIsDeliverableLocal(result);
    
    if (result) {
      onDeliverableChange?.(true);
      setTimeout(() => onOpenChange(false), 500);
    } else {
      onDeliverableChange?.(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setLocalPincode(sanitized);
    setChecked(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5" />
            <span className="font-semibold text-lg">Delivery Location</span>
          </div>
          <p className="text-green-100 text-sm">
            Enter your pincode to check if we deliver to your area
          </p>
        </div>

        {/* Content */}
        <div className="p-6 -mt-4 bg-white rounded-t-3xl relative">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Enter Pincode
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit pincode"
                  value={localPincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="flex-1 h-12 text-lg tracking-widest text-center border-2 border-neutral-200 focus:border-green-500"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              onClick={handleCheck}
              disabled={localPincode.length !== 6 || isLoading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-base"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Check Availability
                </span>
              )}
            </Button>

            {/* Result Message */}
            {checked && !isLoading && (
              <div className={`p-4 rounded-xl ${isDeliverable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {isDeliverable ? (
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🎉</span>
                    <p className="font-semibold text-green-700">Great news!</p>
                    <p className="text-sm text-green-600 mt-1">
                      We deliver to {deliveryArea?.name || 'your area'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">😔</span>
                    <p className="font-semibold text-red-700">We're not here yet</p>
                    <p className="text-sm text-red-600 mt-1">
                      Sorry, we don't deliver to pincode {localPincode} yet. We're expanding soon!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Use GPS Button - Future feature */}
            <button className="w-full flex items-center justify-center gap-2 text-sm text-green-600 py-2 hover:text-green-700">
              <Navigation className="w-4 h-4" />
              Use my current location
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
