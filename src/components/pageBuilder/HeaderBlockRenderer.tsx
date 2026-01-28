import { memo, useMemo } from 'react';
import { HeaderBlock } from '@/types/pageBuilder';

export const HeaderBlockRenderer = memo(({ block }: { block: HeaderBlock }) => {
  const { data } = block;
  const styles = block.styles || {};
  const blockId = `header-${block.id}`;
  
  const sanitizedHtml = useMemo(() => {
    const html = data.html || '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }, [data.html]);

  // Combine CSS from data.css and styles.customCSS
  const combinedCSS = useMemo(() => {
    const cssFromData = data.css || '';
    const cssFromStyles = styles.customCSS || '';
    const allCSS = [cssFromData, cssFromStyles].filter(Boolean).join('\n');
    if (!allCSS) return '';
    return allCSS.replace(/([^{}]+)\{/g, `#${blockId} $1{`);
  }, [data.css, styles.customCSS, blockId]);

  const headerStyle: React.CSSProperties = {
    position: data.position || 'sticky',
    height: data.height || '80px',
    backgroundColor: data.backgroundColor || '#ffffff',
    zIndex: data.zIndex || 1000,
    top: data.position === 'fixed' || data.position === 'sticky' ? 0 : undefined,
  };

  if (sanitizedHtml && sanitizedHtml.trim()) {
    return (
      <header id={blockId} style={headerStyle} className="border-b">
        {combinedCSS && (
          <style dangerouslySetInnerHTML={{ __html: combinedCSS }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </header>
    );
  }

  return (
    <header className="py-4 px-6 bg-white border-b" style={headerStyle}>
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
      </div>
    </header>
  );
});

HeaderBlockRenderer.displayName = 'HeaderBlockRenderer';
