import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  store_name: string;
  plan: 'trial' | 'pro';
  trial_ends_at: string;
}

interface TrialPopupProps {
  tenant: Tenant | null;
  isTrialExpired: boolean;
  onUpgrade: () => void;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TrialPopup({ tenant, isTrialExpired, onUpgrade, open, onOpenChange }: TrialPopupProps) {
  const navigate = useNavigate();
  const [trialEndDate, setTrialEndDate] = useState<string>('');
  const [renewalDate, setRenewalDate] = useState<string>('');

  useEffect(() => {
    if (tenant?.trial_ends_at) {
      const endDate = new Date(tenant.trial_ends_at);
      setTrialEndDate(format(endDate, 'MMM d'));
      
      // Calculate renewal date (3 months from now for the offer)
      const renewal = new Date();
      renewal.setMonth(renewal.getMonth() + 3);
      setRenewalDate(format(renewal, 'MMM d, yyyy'));
    }
  }, [tenant]);

  if (!tenant || tenant.plan === 'pro') return null;

  const canClose = !isTrialExpired;

  const handleUpgrade = () => {
    onUpgrade();
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleViewPlans = () => {
    navigate('/dashboard/upgrade');
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleSeeStoreDetails = () => {
    navigate('/dashboard/settings');
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent 
        className="max-w-4xl p-0 gap-0 overflow-hidden [&>button]:hidden"
        onInteractOutside={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
      >
        <div className="grid md:grid-cols-2">
          {/* Left Section - Dark Background */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Get back to business for ₹20
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base">
                      {trialEndDate && (
                        <>
                          {trialEndDate} - Free trial ended. Good news — we saved your progress!
                        </>
                      )}
                      {!trialEndDate && 'Free trial ended. Good news — we saved your progress!'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base">
                      Today - <span className="line-through">₹1,994</span> ₹20/mo for 3 months. That's 98% off
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base">
                      Always - No commitment, cancel anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-700">
              <button
                onClick={handleViewPlans}
                className="text-sm text-gray-300 hover:text-white underline"
              >
                View all plans
              </button>
              <br />
              <button
                onClick={handleSeeStoreDetails}
                className="text-sm text-gray-300 hover:text-white underline"
              >
                See store details
              </button>
            </div>
          </div>

          {/* Right Section - White Background */}
          <div className="bg-white p-8 md:p-10 flex flex-col relative">
            {canClose && (
              <button
                onClick={() => onOpenChange?.(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex-1">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Enable international transactions</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You may need to contact your bank and ask them to enable international transactions to make sure your payment goes through.{' '}
                  <a href="#" className="underline">Learn more</a>
                </p>
              </div>

              {/* Domain Offer Section */}
              <div className="mb-6">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>Includes domain offer</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 text-xs text-gray-600">
                    Domain offer details will be shown here
                  </div>
                </details>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="radio"
                    name="payment"
                    id="upi"
                    defaultChecked
                    className="w-4 h-4"
                  />
                  <label htmlFor="upi" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      GP
                    </div>
                    <div>
                      <div className="text-sm font-medium">UPI</div>
                      <div className="text-xs text-gray-500">
                        Accepted apps include Google Pay, PhonePe & more. Send your UPI ID verification.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* UPI Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Enter a UPI ID</label>
                  <input
                    type="text"
                    placeholder="Example: username@razorpay"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phone number</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Business Location */}
              <div className="mb-6">
                <label className="block text-xs text-gray-600 mb-1">
                  For accurate tax calculation, please provide the location of your business:
                </label>
                <input
                  type="text"
                  placeholder="Business location"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Subscribe Button */}
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white mb-4"
                size="lg"
              >
                Subscribe for ₹20 INR
              </Button>

              {/* Fine Print */}
              <p className="text-xs text-gray-500 text-center">
                Plus applicable taxes. Renews {renewalDate} on Basic plan ₹1,994/mo
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
