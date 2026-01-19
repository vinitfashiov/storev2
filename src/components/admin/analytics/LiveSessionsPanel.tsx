import { Users, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveStats {
  active_sessions: number;
  visitors_right_now: number;
  active_carts: number;
  checking_out: number;
  purchased: number;
  top_locations: Array<{
    country: string;
    country_code: string;
    city: string;
    lat: number;
    lng: number;
    count: number;
  }>;
}

interface LiveSessionsPanelProps {
  stats: LiveStats | null;
  loading?: boolean;
  totalSales?: number;
  totalOrders?: number;
}

export function LiveSessionsPanel({ 
  stats, 
  loading = false,
  totalSales = 0,
  totalOrders = 0
}: LiveSessionsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const visitors = stats?.visitors_right_now || 0;
  const sessions = stats?.active_sessions || 0;
  const activeCarts = stats?.active_carts || 0;
  const checkingOut = stats?.checking_out || 0;
  const purchased = stats?.purchased || 0;
  const topLocations = stats?.top_locations || [];

  // Calculate max for progress bars
  const maxBehavior = Math.max(activeCarts, checkingOut, purchased, 1);

  return (
    <div className="space-y-4">
      {/* Visitors Right Now */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-muted-foreground">Visitors right now</span>
            </div>
            <p className="text-2xl font-bold">{visitors}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Total sales</span>
            </div>
            <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Total sessions</div>
            <p className="text-xl font-bold">{sessions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Total orders</div>
            <p className="text-xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Top locations
            <span className="text-xs text-muted-foreground font-normal">
              {topLocations.reduce((acc, loc) => acc + loc.count, 0)} session{topLocations.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {topLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations yet</p>
          ) : (
            <div className="space-y-2">
              {topLocations.slice(0, 5).map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getFlagEmoji(loc.country_code)}
                    </span>
                    <span className="text-sm">{loc.city || loc.country}</span>
                  </div>
                  <span className="text-sm font-medium">{loc.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Behavior */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Customer behavior
            <span className="text-xs text-muted-foreground font-normal">10 min</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="relative mx-auto mb-2 w-12 h-12 sm:w-16 sm:h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${(activeCarts / maxBehavior) * 100} 100`}
                    className="text-blue-500"
                  />
                </svg>
                <ShoppingCart className="absolute inset-0 m-auto h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <p className="text-lg sm:text-xl font-bold">{activeCarts}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Active carts</p>
            </div>
            
            <div className="text-center">
              <div className="relative mx-auto mb-2 w-12 h-12 sm:w-16 sm:h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${(checkingOut / maxBehavior) * 100} 100`}
                    className="text-purple-500"
                  />
                </svg>
                <CreditCard className="absolute inset-0 m-auto h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </div>
              <p className="text-lg sm:text-xl font-bold">{checkingOut}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Checking out</p>
            </div>
            
            <div className="text-center">
              <div className="relative mx-auto mb-2 w-12 h-12 sm:w-16 sm:h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${(purchased / maxBehavior) * 100} 100`}
                    className="text-green-500"
                  />
                </svg>
                <CheckCircle className="absolute inset-0 m-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <p className="text-lg sm:text-xl font-bold">{purchased}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Purchased</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">
            {visitors > 0 ? `${visitors} active visitor${visitors !== 1 ? 's' : ''}` : 'No customers yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
