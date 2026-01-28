import { memo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Code, Eye } from 'lucide-react';

interface CodeEditorProps {
  html: string;
  css: string;
  onHtmlChange: (html: string) => void;
  onCssChange: (css: string) => void;
}

export const CodeEditor = memo(({ html, css, onHtmlChange, onCssChange }: CodeEditorProps) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'preview'>('html');
  const [previewHtml, setPreviewHtml] = useState(html);
  const [previewCss, setPreviewCss] = useState(css);

  const handleHtmlChange = (value: string) => {
    onHtmlChange(value);
    setPreviewHtml(value);
  };

  const handleCssChange = (value: string) => {
    onCssChange(value);
    setPreviewCss(value);
  };

  const updatePreview = () => {
    setPreviewHtml(html);
    setPreviewCss(css);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
        <div className="border-b px-4 py-2 flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="html" className="text-xs">
              <Code className="w-3 h-3 mr-1.5" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="text-xs">
              <Code className="w-3 h-3 mr-1.5" />
              CSS
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="w-3 h-3 mr-1.5" />
              Preview
            </TabsTrigger>
          </TabsList>
          {activeTab !== 'preview' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={updatePreview}>
              Update Preview
            </Button>
          )}
        </div>

        <TabsContent value="html" className="flex-1 m-0 p-4">
          <div className="h-full flex flex-col">
            <Label className="text-xs mb-2">HTML Code</Label>
            <Textarea
              value={html}
              onChange={(e) => handleHtmlChange(e.target.value)}
              placeholder="<div>Your HTML here</div>"
              className="flex-1 font-mono text-xs resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter your HTML code. Script tags will be removed for security.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="css" className="flex-1 m-0 p-4">
          <div className="h-full flex flex-col">
            <Label className="text-xs mb-2">CSS Code</Label>
            <Textarea
              value={css}
              onChange={(e) => handleCssChange(e.target.value)}
              placeholder=".my-class { color: red; }"
              className="flex-1 font-mono text-xs resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter your CSS code. Styles will be scoped to this section.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 p-4 overflow-auto">
          <div className="bg-background border rounded-lg p-4 min-h-full">
            {previewHtml || previewCss ? (
              <>
                {previewCss && (
                  <style dangerouslySetInnerHTML={{ __html: previewCss }} />
                )}
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No code to preview</p>
                <p className="text-xs mt-1">Add HTML and CSS to see preview</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
