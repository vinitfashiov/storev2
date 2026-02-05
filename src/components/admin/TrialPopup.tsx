import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check, Globe, Server, Upload, Users, ShieldCheck } from 'lucide-react';

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

  if (!tenant || tenant.plan === 'pro') return null;

  const handleUpgrade = () => {
    if (onOpenChange) onOpenChange(false);
    onUpgrade();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] p-0 gap-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-50 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-8 text-center bg-[#0F172A] text-white">
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-indigo-500/40">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight">
            {isTrialExpired ? 'Trial Expired' : 'Unlock Full Access'}
          </h2>
          <p className="text-gray-400 text-sm px-4">
            {isTrialExpired
              ? 'Your trial has expired. Subscribe now to resume full access.'
              : 'Upgrade your store to premium'}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">₹249</span>
              <span className="text-gray-500 font-medium">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Billed monthly. Cancel anytime.</p>
          </div>

          <div className="space-y-3 pl-2">
            <FeatureItem icon={Globe} text="Custom domain lifetime" />
            <FeatureItem icon={Server} text="Lifetime server" />
            <FeatureItem icon={Upload} text="Unlimited product upload" />
            <FeatureItem icon={Users} text="Unlimited customers management" />
          </div>

          <Button
            onClick={handleUpgrade}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            Buy Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
      </div>
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}

