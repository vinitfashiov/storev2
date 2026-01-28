import { memo, useMemo } from 'react';
import { ThemeSection } from '@/types/themeEditor';
import { Code } from 'lucide-react';

interface CustomHtmlSectionRendererProps {
  section: ThemeSection;
}

export const CustomHtmlSectionRenderer = memo(({ section }: CustomHtmlSectionRendererProps) => {
  const sectionId = `custom-section-${section.id}`;

  // Sanitize HTML (remove script tags)
  const sanitizedHtml = useMemo(() => {
    const html = section.customHtml || '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }, [section.customHtml]);

  // Combine CSS from customCss and customStyles.customCSS
  const combinedCSS = useMemo(() => {
    const cssFromData = section.customCss || '';
    const cssFromStyles = section.customStyles?.customCSS || '';
    const allCSS = [cssFromData, cssFromStyles].filter(Boolean).join('\n');
    if (!allCSS) return '';
    // Scope CSS to section ID
    return allCSS.replace(/([^{}]+)\{/g, `#${sectionId} $1{`);
  }, [section.customCss, section.customStyles?.customCSS, sectionId]);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.settings.backgroundColor,
    backgroundImage: section.settings.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
    backgroundSize: section.settings.backgroundSize || 'cover',
    backgroundPosition: section.settings.backgroundPosition || 'center',
    paddingTop: section.settings.padding?.top || '1rem',
    paddingRight: section.settings.padding?.right || '1rem',
    paddingBottom: section.settings.padding?.bottom || '1rem',
    paddingLeft: section.settings.padding?.left || '1rem',
  };

  if (!sanitizedHtml && !combinedCSS) {
    return (
      <section id={sectionId} style={sectionStyle} className="w-full">
        <div className="text-center py-16 text-muted-foreground">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">Custom HTML/CSS Section</p>
          <p className="text-xs mt-1">Add HTML and CSS code to see content</p>
        </div>
      </section>
    );
  }

  return (
    <section id={sectionId} style={sectionStyle} className="w-full">
      {combinedCSS && <style dangerouslySetInnerHTML={{ __html: combinedCSS }} />}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
    </section>
  );
});

CustomHtmlSectionRenderer.displayName = 'CustomHtmlSectionRenderer';
