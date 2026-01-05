import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ExternalLink } from 'lucide-react';

interface AdminPageBuilderProps {
  tenantId: string;
  disabled?: boolean;
}

// This component now redirects to the full-page Page Builder
export default function AdminPageBuilder({ tenantId, disabled }: AdminPageBuilderProps) {
  const navigate = useNavigate();

  const openPageBuilder = () => {
    // Open in same tab - full page builder experience
    navigate(`/page-builder?tenant=${tenantId}`);
  };

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Visual Page Builder</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create stunning homepage layouts with our drag-and-drop builder. 
          Add hero sections, product grids, testimonials, and more.
        </p>
        <Button onClick={openPageBuilder} disabled={disabled} size="lg">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Page Builder
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Opens in full-screen mode for the best editing experience
        </p>
      </CardContent>
    </Card>
  );
}
