import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Globe,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CustomDomain {
  id: string;
  domain: string;
  status: 'pending' | 'active';
  created_at: string;
}

export default function AdminDomains() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // State to store verification instructions per domain
  const [verificationInstructions, setVerificationInstructions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchTenantAndDomains();
  }, []);

  const fetchTenantAndDomains = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (!profile?.tenant_id) {
      navigate('/onboarding');
      return;
    }

    setTenantId(profile.tenant_id);

    const { data, error } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load domains');
    } else {
      setDomains((data || []).map(d => ({
        ...d,
        status: d.status as 'pending' | 'active'
      })));
    }
    setLoading(false);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim() || !tenantId) return;

    // Updated pattern to support subdomains (e.g., shop.example.com)
    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    const cleanDomain = newDomain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

    if (!domainPattern.test(cleanDomain)) {
      toast.error('Please enter a valid domain (e.g., example.com or shop.example.com)');
      return;
    }

    setAdding(true);

    const { data, error } = await supabase
      .from('custom_domains')
      .insert({
        tenant_id: tenantId,
        domain: cleanDomain,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('This domain is already in use');
      } else {
        toast.error('Failed to add domain');
      }
    } else if (data) {
      const newDomainData: CustomDomain = {
        ...data,
        status: data.status as 'pending' | 'active'
      };
      setDomains([newDomainData, ...domains]);
      setNewDomain('');
      setDialogOpen(false);
      toast.success('Domain added! Verifying with Vercel...');

      // Auto-trigger verification to register it on Vercel immediately
      handleVerifyDomain(newDomainData, true);
    }

    setAdding(false);
  };

  const handleVerifyDomain = async (domain: CustomDomain, isAuto = false) => {
    if (!isAuto) setVerifying(domain.id);

    try {
      const { data, error } = await supabase.functions.invoke('verify-domain-dns', {
        body: { domain: domain.domain, domain_id: domain.id }
      });

      if (error) {
        if (!isAuto) toast.error('Failed to verify domain');
        return;
      }

      if (data.verified) {
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, status: 'active' } : d));
        toast.success(data.message || 'Domain verified and activated!');
        // Clear instructions if verified
        const newInstructions = { ...verificationInstructions };
        delete newInstructions[domain.id];
        setVerificationInstructions(newInstructions);
      } else {
        if (!isAuto) {
          toast.error(data.message || 'Verification pending. Please check DNS configuration.');
        }
        // Save specific instructions if provided (e.g., TXT record)
        if (data.instructions && Array.isArray(data.instructions)) {
          setVerificationInstructions(prev => ({
            ...prev,
            [domain.id]: data.instructions
          }));
        }
      }
    } catch (err) {
      if (!isAuto) toast.error('Failed to verify domain');
    } finally {
      if (!isAuto) setVerifying(null);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete domain');
    } else {
      setDomains(domains.filter(d => d.id !== id));
      toast.success('Domain removed');
      // Clear instructions
      const newInstructions = { ...verificationInstructions };
      delete newInstructions[id];
      setVerificationInstructions(newInstructions);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getDomainType = (domain: string) => {
    const parts = domain.split('.');
    return parts.length > 2 ? 'subdomain' : 'root';
  };

  const getStandardDnsInstructions = (domain: string) => {
    const parts = domain.split('.');
    if (parts.length > 2) {
      // Subdomain like shop.example.com -> CNAME
      const subdomain = parts.slice(0, -2).join('.');
      return { type: 'CNAME', name: subdomain, value: 'cname.vercel-dns.com' };
    }
    // Root domain -> A Record
    return { type: 'A', name: '@', value: '76.76.21.21' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Custom Domains</h1>
          <p className="text-muted-foreground">Connect your own domain to your storefront</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Enter your domain or subdomain to connect it to your storefront.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com or shop.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter without http:// or www. Supports both root domains (mystore.com) and subdomains (shop.mystore.com)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()}>
                {adding ? 'Adding...' : 'Add Domain'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* DNS Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>DNS Configuration Required</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">After adding a domain, configure these DNS records with your domain registrar:</p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 font-mono text-sm">
            <div>
              <p className="text-muted-foreground mb-2 font-sans">For root domains (example.com):</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Type:</span> <strong>A</strong> &nbsp;
                  <span className="text-muted-foreground">Name:</span> <strong>@</strong> &nbsp;
                  <span className="text-muted-foreground">Value:</span> <strong>76.76.21.21</strong>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('76.76.21.21')}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 font-sans">For subdomains (shop.example.com):</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Type:</span> <strong>CNAME</strong> &nbsp;
                  <span className="text-muted-foreground">Name:</span> <strong>shop</strong> (your subdomain) &nbsp;
                  <span className="text-muted-foreground">Value:</span> <strong>cname.vercel-dns.com</strong>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('cname.vercel-dns.com')}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Ownership Verification</p>
                <p className="text-xs text-yellow-700 mt-1">
                  If you see a "Verification Needed" or "Linked to another account" error, you may need to add a <strong>TXT</strong> record. Check the status card below for specific instructions.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            DNS changes can take up to 48 hours to propagate. Click "Verify DNS" after configuring to activate your domain.
          </p>
        </AlertDescription>
      </Alert>

      {/* Domains List */}
      {domains.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium mb-2">No custom domains</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a custom domain to give your store a professional look.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => {
            const domainType = getDomainType(domain.domain);
            const standardDns = getStandardDnsInstructions(domain.domain);
            const customInstructions = verificationInstructions[domain.id];

            return (
              <Card key={domain.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{domain.domain}</span>
                            <Badge variant={domain.status === 'active' ? 'default' : 'secondary'}>
                              {domain.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {domainType === 'subdomain' ? 'Subdomain' : 'Root'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Default DNS: {standardDns.type} record for "{standardDns.name}" → {standardDns.value}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {domain.status === 'active' && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        )}

                        {domain.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyDomain(domain)}
                            disabled={verifying === domain.id}
                          >
                            {verifying === domain.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Verify DNS
                              </>
                            )}
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {domain.domain}? Your storefront will no longer be accessible on this domain.
                                <br /><br />
                                <strong>Note:</strong> You should also remove the DNS records from your provider to avoid errors.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDomain(domain.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Verification Instructions (TXT Records etc) */}
                    {customInstructions && customInstructions.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-md p-3 mt-2">
                        <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Action Required: Add these records to verify ownership
                        </h4>
                        <div className="space-y-2">
                          {customInstructions.map((instr, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-red-100">
                              <div>
                                <span className="font-bold text-red-700">{instr.type}</span> &nbsp;
                                <span className="text-muted-foreground">Name:</span> <code className="bg-gray-100 px-1 rounded">{instr.name}</code> &nbsp;
                                <span className="text-muted-foreground">Value:</span> <code className="bg-gray-100 px-1 rounded truncate max-w-[200px] inline-block align-bottom">{instr.value}</code>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(instr.value)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
