import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Smartphone, Share, Plus, Check, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallPromptProps {
  variant?: 'button' | 'card' | 'banner';
  appName?: string;
  description?: string;
  onInstalled?: () => void;
}

export function PWAInstallPrompt({ 
  variant = 'button',
  appName = 'App',
  description,
  onInstalled
}: PWAInstallPromptProps) {
  const { canInstall, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const success = await promptInstall();
    if (success && onInstalled) {
      onInstalled();
    }
  };

  // Already installed
  if (isInstalled) {
    if (variant === 'button') {
      return (
        <Button variant="outline" disabled className="gap-2">
          <Check className="h-4 w-4" />
          Installed
        </Button>
      );
    }
    return null;
  }

  // Can't install on this device/browser
  if (!canInstall && !isIOS) {
    return null;
  }

  const InstallButton = () => (
    <Button onClick={handleInstall} className="gap-2">
      <Download className="h-4 w-4" />
      Install {appName}
    </Button>
  );

  if (variant === 'button') {
    return (
      <>
        <InstallButton />
        <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} appName={appName} />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Install {appName}
            </CardTitle>
            <CardDescription>
              {description || `Install ${appName} on your device for quick access and offline support.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstallButton />
          </CardContent>
        </Card>
        <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} appName={appName} />
      </>
    );
  }

  // Banner variant
  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Install {appName}</p>
            <p className="text-xs text-muted-foreground">
              {isIOS ? 'Add to Home Screen for quick access' : 'Install for quick access & offline support'}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleInstall} className="gap-1">
          <Download className="h-4 w-4" />
          Install
        </Button>
      </div>
      <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} appName={appName} />
    </>
  );
}

function IOSInstallGuide({ 
  open, 
  onOpenChange,
  appName 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  appName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install {appName} on iOS</DialogTitle>
          <DialogDescription>
            Follow these steps to add the app to your home screen
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Tap the Share button</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Look for the <Share className="h-4 w-4" /> icon at the bottom of Safari
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Look for the <Plus className="h-4 w-4" /> Add to Home Screen option
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Tap "Add"</p>
              <p className="text-sm text-muted-foreground">
                The app will now appear on your home screen
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
