import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface StorefrontInstallBannerProps {
  storeName: string;
}

export function StorefrontInstallBanner({ storeName }: StorefrontInstallBannerProps) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  // Check if user has dismissed before (per session)
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }
    
    const success = await promptInstall();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if already installed, dismissed, or can't install (and not iOS)
  if (isInstalled || dismissed || (!canInstall && !isIOS)) {
    return null;
  }

  // iOS tip tooltip
  if (showIOSTip) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-sm">Install {storeName}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={() => setShowIOSTip(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
              Tap <Share className="h-4 w-4 inline" /> at the bottom
            </p>
            <p className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">2</span>
              Scroll and tap <Plus className="h-4 w-4 inline" /> Add to Home Screen
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-40 pointer-events-none md:hidden">
      <div className="max-w-md mx-auto bg-background border rounded-xl shadow-lg p-3 pointer-events-auto animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">Install {storeName}</p>
            <p className="text-xs text-muted-foreground">Quick access & offline browsing</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              className="gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
