import { memo, useMemo } from 'react';
import { FooterBlock } from '@/types/pageBuilder';

export const FooterBlockRenderer = memo(({ block }: { block: FooterBlock }) => {
  const { data } = block;
  const styles = block.styles || {};
  const blockId = `footer-${block.id}`;
  
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

  const footerStyle: React.CSSProperties = {
    backgroundColor: data.backgroundColor || '#1f2937',
    padding: data.padding || '2rem 0',
  };

  if (sanitizedHtml && sanitizedHtml.trim()) {
    return (
      <footer id={blockId} style={footerStyle} className="text-white">
        {combinedCSS && (
          <style dangerouslySetInnerHTML={{ __html: combinedCSS }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </footer>
    );
  }

  return (
    <footer className="py-8 px-6 text-white" style={footerStyle}>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="h-4 w-24 bg-white/20 rounded mb-2" />
          <div className="h-3 w-32 bg-white/10 rounded mb-1" />
          <div className="h-3 w-28 bg-white/10 rounded" />
        </div>
        <div>
          <div className="h-4 w-20 bg-white/20 rounded mb-2" />
          <div className="h-3 w-24 bg-white/10 rounded mb-1" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
        <div>
          <div className="h-4 w-24 bg-white/20 rounded mb-2" />
          <div className="h-3 w-32 bg-white/10 rounded mb-1" />
          <div className="h-3 w-28 bg-white/10 rounded" />
        </div>
      </div>
    </footer>
  );
});

FooterBlockRenderer.displayName = 'FooterBlockRenderer';
