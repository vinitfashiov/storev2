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
import { X, Check, Zap, Shield, Crown, TrendingUp, Globe, Package, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

const PRO_FEATURES = [
  { icon: Package, text: 'Unlimited products' },
  { icon: TrendingUp, text: 'Unlimited orders' },
  { icon: Globe, text: 'Custom domain support' },
  { icon: Shield, text: 'Priority support' },
  { icon: BarChart3, text: 'Advanced analytics' },
  { icon: Zap, text: 'No transaction fees' },
  { icon: Crown, text: 'Hero banners & pages' },
  { icon: Users, text: 'Multiple delivery zones' },
];

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
    // Close popup first to prevent further clicks
    if (onOpenChange) {
      onOpenChange(false);
    }
    // Navigate to upgrade page
    onUpgrade();
  };

  const handleViewPlans = () => {
    // Close popup first to prevent further clicks
    if (onOpenChange) {
      onOpenChange(false);
    }
    // Navigate to upgrade page
    navigate('/dashboard/upgrade');
  };

  const handleSeeStoreDetails = () => {
    // Close popup first to prevent further clicks
    if (onOpenChange) {
      onOpenChange(false);
    }
    // Navigate to store settings page
    navigate('/dashboard/store-settings');
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent 
        className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden [&>button]:hidden sm:max-w-4xl"
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
        {/* Top Message - Only show when trial is expired */}
        {isTrialExpired && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-sm sm:text-base text-amber-900 font-medium text-center">
              Your free trial for this store is expired. Purchase our premium plan to continue growing online.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[calc(95vh-60px)] overflow-y-auto">
          {/* Left Section - Dark Background */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[300px] sm:min-h-[400px]">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
                Get back to business
              </h2>
              
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                      {trialEndDate && (
                        <>
                          {trialEndDate} - Free trial ended. Good news — we saved your progress!
                        </>
                      )}
                      {!trialEndDate && !isTrialExpired && 'Your 7-day free trial is active. Upgrade anytime to continue!'}
                      {!trialEndDate && isTrialExpired && 'Free trial ended. Good news — we saved your progress!'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                      Start with only ₹249/month — Full access to all Pro features
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed">
                      Always - No commitment, cancel anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleViewPlans}
                className="text-xs sm:text-sm text-gray-300 hover:text-white underline transition-colors w-full text-left"
              >
                View all plans
              </button>
              <button
                onClick={handleSeeStoreDetails}
                className="text-xs sm:text-sm text-gray-300 hover:text-white underline transition-colors w-full text-left"
              >
                See store details
              </button>
            </div>
          </div>

          {/* Right Section - White Background with Features */}
          <div className="bg-white p-6 sm:p-8 md:p-10 flex flex-col relative min-h-[300px] sm:min-h-[400px]">
            {canClose && (
              <button
                onClick={() => onOpenChange?.(false)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Unlock Pro Features
              </h3>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Upgrade to Pro and get access to powerful features to grow your business
              </p>

              {/* Features List */}
              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1 overflow-y-auto">
                {PRO_FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {feature.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upgrade Button */}
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white mb-2 sm:mb-3 shadow-lg text-sm sm:text-base py-2 sm:py-3"
                size="lg"
              >
                Start with only ₹249/month
              </Button>

              {/* Fine Print */}
              <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-tight">
                No commitment, cancel anytime. Full access to all Pro features.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
