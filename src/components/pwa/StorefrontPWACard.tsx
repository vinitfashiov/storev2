import { useState, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontPWACardProps {
  storeSlug: string;
  storeName: string;
}

export const StorefrontPWACard = forwardRef<HTMLDivElement, StorefrontPWACardProps>(
  ({ storeSlug, storeName }, ref) => {
    const [copied, setCopied] = useState(false);
    
    // Generate the storefront URL
    const baseUrl = window.location.origin;
    const storefrontUrl = `${baseUrl}/store/${storeSlug}`;
    
    // The install page URL that customers can visit to install the PWA
    const installUrl = `${storefrontUrl}?install=true`;

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(installUrl);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy link');
      }
    };

    const openStorefront = () => {
      window.open(storefrontUrl, '_blank');
    };

    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Storefront Mobile App
          </CardTitle>
          <CardDescription>
            Let your customers install your store as a mobile app on their phones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* How it works */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Customers visit your store on their mobile browser</li>
              <li>• They can install it as an app on their home screen</li>
              <li>• App opens directly to your store with offline support</li>
              <li>• Your branding (logo, name, colors) is used</li>
            </ul>
          </div>

          {/* Share link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share this link with customers:</label>
            <div className="flex gap-2">
              <Input 
                value={installUrl} 
                readOnly 
                className="text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={openStorefront}
            >
              <ExternalLink className="h-4 w-4" />
              Preview Store
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => {
                window.open(storefrontUrl, '_blank');
                toast.info('Open this link on your phone to install the app');
              }}
            >
              <Download className="h-4 w-4" />
              Test Install
            </Button>
          </div>

          {/* Tips */}
          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            <p className="font-medium mb-1">💡 Tips:</p>
            <ul className="space-y-0.5">
              <li>• Upload a logo in Store Settings for custom app icon</li>
              <li>• Set your website title for the app name</li>
              <li>• Share the link via WhatsApp, SMS, or social media</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }
);

StorefrontPWACard.displayName = 'StorefrontPWACard';
