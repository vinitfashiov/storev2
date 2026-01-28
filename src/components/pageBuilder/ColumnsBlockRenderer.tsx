import { memo } from 'react';
import { ColumnsBlock } from '@/types/pageBuilder';
import { BlockRenderer } from './PageBuilderRenderer';

export const ColumnsBlockRenderer = memo(({ 
  block, 
  tenantId, 
  storeSlug, 
  onAddToCart, 
  addingProductId 
}: { 
  block: ColumnsBlock;
  tenantId: string;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number) => Promise<void>;
  addingProductId?: string | null;
}) => {
  const { data } = block;
  const columns = data.columns || [];
  const gap = data.gap || '1rem';
  
  return (
    <section className="py-6 px-4">
      <div className="flex gap-4" style={{ gap }}>
        {columns.map((col) => (
          <div 
            key={col.id} 
            className="column-content"
            style={{ width: col.width || '33.33%', minHeight: '200px' }}
          >
            {col.content && col.content.length > 0 ? (
              col.content.map((nestedBlock) => (
                <BlockRenderer
                  key={nestedBlock.id}
                  block={nestedBlock}
                  tenantId={tenantId}
                  storeSlug={storeSlug}
                  onAddToCart={onAddToCart}
                  addingProductId={addingProductId}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground/50 p-4 border border-dashed rounded">
                Empty column
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});

ColumnsBlockRenderer.displayName = 'ColumnsBlockRenderer';
