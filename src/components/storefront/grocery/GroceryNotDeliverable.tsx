import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGroceryLocation } from '@/contexts/GroceryLocationContext';

interface GroceryNotDeliverableProps {
  storeName: string;
  onChangeLocation: () => void;
}

export function GroceryNotDeliverable({ storeName, onChangeLocation }: GroceryNotDeliverableProps) {
  const { pincode } = useGroceryLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col">
      {/* Header with location */}
      <header className="px-4 py-4 flex items-center justify-between">
        <button 
          onClick={onChangeLocation}
          className="flex items-center gap-2 text-white"
        >
          <MapPin className="w-5 h-5 text-green-400" />
          <div className="text-left">
            <p className="text-sm font-semibold">{pincode || 'Set Location'}</p>
            <p className="text-xs text-slate-400">India</p>
          </div>
          <svg className="w-4 h-4 text-white ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Illustration */}
        <div className="relative w-72 h-56 mb-8">
          {/* Background stars */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          
          {/* UFO */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* UFO body */}
              <div className="w-32 h-8 bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-full relative">
                <div className="absolute inset-x-0 -top-4 flex justify-center">
                  <div className="w-12 h-8 bg-gradient-to-t from-red-400 to-red-300 rounded-t-full" />
                </div>
                {/* Lights */}
                <div className="absolute bottom-0 inset-x-4 flex justify-around">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
              {/* Beam */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-20 opacity-30"
                style={{
                  background: 'linear-gradient(180deg, rgba(74, 222, 128, 0.4) 0%, transparent 100%)',
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
                }}
              />
            </div>
          </div>

          {/* Donut */}
          <div className="absolute top-4 right-4 w-16 h-16">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-300 to-amber-500 p-2">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
              </div>
            </div>
            {/* Sprinkles */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-2 rounded-full"
                  style={{
                    background: ['#f87171', '#4ade80', '#60a5fa', '#facc15'][i % 4],
                    left: `${30 + Math.cos(i * 60 * Math.PI / 180) * 25}%`,
                    top: `${30 + Math.sin(i * 60 * Math.PI / 180) * 25}%`,
                    transform: `rotate(${i * 60}deg)`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pizza slice */}
          <div className="absolute bottom-4 left-4 w-12 h-12">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <path d="M24 4L4 44h40L24 4z" fill="#FCD34D" />
              <path d="M24 8L8 40h32L24 8z" fill="#FBBF24" />
              <circle cx="18" cy="28" r="3" fill="#EF4444" />
              <circle cx="28" cy="24" r="2" fill="#EF4444" />
              <circle cx="22" cy="34" r="2" fill="#EF4444" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          We'll be there soon – hang tight!
        </h2>
        <p className="text-slate-400 mb-8 max-w-xs">
          Looks like online ordering isn't available at your location yet.
        </p>

        {/* Change Location Button */}
        <Button
          onClick={onChangeLocation}
          variant="outline"
          className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 rounded-full px-6"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Change Location
        </Button>
      </div>

      {/* Coming Soon Text */}
      <div className="text-center pb-8">
        <p className="text-slate-500 text-sm">{storeName}</p>
        <p className="text-xs text-slate-600 mt-1">Expanding to your area soon!</p>
      </div>
    </div>
  );
}
