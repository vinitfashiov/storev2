import { memo } from 'react';
import { SaleBannerBlock } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const SaleBannerBlockRenderer = memo(({ block }: { block: SaleBannerBlock }) => {
  const { data } = block;
  
  return (
    <section 
      className="py-8 px-6 text-center"
      style={{ 
        backgroundColor: data.backgroundColor || '#ef4444',
        color: data.textColor || '#ffffff'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {data.discount && (
          <div className="text-4xl font-bold mb-2">{data.discount} OFF</div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title || 'Big Sale!'}</h2>
        {data.subtitle && (
          <p className="text-lg mb-4 opacity-90">{data.subtitle}</p>
        )}
        {data.endDate && (
          <p className="text-sm mb-4 opacity-80">
            Ends: {new Date(data.endDate).toLocaleDateString()}
          </p>
        )}
        {data.ctaText && data.ctaUrl && (
          <Link to={data.ctaUrl}>
            <Button size="lg" variant="secondary">
              {data.ctaText}
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
});

SaleBannerBlockRenderer.displayName = 'SaleBannerBlockRenderer';
