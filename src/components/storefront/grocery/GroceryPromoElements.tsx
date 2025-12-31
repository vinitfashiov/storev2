import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface GroceryMembershipCardProps {
  storeSlug: string;
}

export function GroceryMembershipCard({ storeSlug }: GroceryMembershipCardProps) {
  return (
    <div className="mx-4 my-4">
      <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <p className="font-bold text-neutral-900 text-sm">You're eligible for a free membership trail!</p>
            <p className="text-xs text-neutral-600">Save ₹50 delivery charge on every order</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400" />
      </div>
    </div>
  );
}

interface GroceryOrderTrackingToastProps {
  orderId: string;
  storeSlug: string;
  onClose?: () => void;
}

export function GroceryOrderTrackingToast({ orderId, storeSlug, onClose }: GroceryOrderTrackingToastProps) {
  return (
    <Link 
      to={`/store/${storeSlug}/account/orders/${orderId}`}
      className="fixed bottom-20 left-4 right-4 z-40 bg-green-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl lg:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="text-lg">🛵</span>
        </div>
        <div>
          <p className="font-semibold text-sm">Your order is on the way!</p>
          <p className="text-xs text-white/80">Order ID: {orderId}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={(e) => { e.preventDefault(); onClose(); }} className="p-1">
          <span className="text-xl">×</span>
        </button>
      )}
    </Link>
  );
}
