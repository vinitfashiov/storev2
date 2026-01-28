import { memo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { ThemeSection } from '@/types/themeEditor';
import { CodeEditor } from './CodeEditor';

interface SectionSettingsPanelProps {
  section: ThemeSection | null;
  onUpdate: (updates: Partial<ThemeSection>) => void;
  onClose: () => void;
}

export const SectionSettingsPanel = memo(({ section, onUpdate, onClose }: SectionSettingsPanelProps) => {
  if (!section) return null;

  const handleUpdate = (updates: Partial<ThemeSection>) => {
    onUpdate(updates);
  };

  const handleSettingsUpdate = (settings: Partial<ThemeSection['settings']>) => {
    handleUpdate({
      settings: { ...section.settings, ...settings },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Section Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {section.title || section.type}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="content" className="flex-1 text-xs">Content</TabsTrigger>
            <TabsTrigger value="layout" className="flex-1 text-xs">Layout</TabsTrigger>
            <TabsTrigger value="style" className="flex-1 text-xs">Style</TabsTrigger>
            {section.type === 'custom-html-css' && (
              <TabsTrigger value="code" className="flex-1 text-xs">Code</TabsTrigger>
            )}
            <TabsTrigger value="data" className="flex-1 text-xs">Data</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="section-title" className="text-xs">Title</Label>
              <Input
                id="section-title"
                value={section.title || ''}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                placeholder="Section title"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-subtitle" className="text-xs">Subtitle</Label>
              <Textarea
                id="section-subtitle"
                value={section.subtitle || ''}
                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                placeholder="Section subtitle"
                className="h-16 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-title" className="text-xs">Show Title</Label>
              <Switch
                id="show-title"
                checked={section.settings.showTitle ?? true}
                onCheckedChange={(checked) =>
                  handleSettingsUpdate({ showTitle: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-subtitle" className="text-xs">Show Subtitle</Label>
              <Switch
                id="show-subtitle"
                checked={section.settings.showSubtitle ?? false}
                onCheckedChange={(checked) =>
                  handleSettingsUpdate({ showSubtitle: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-view-all" className="text-xs">Show View All</Label>
              <Switch
                id="show-view-all"
                checked={section.settings.showViewAll ?? true}
                onCheckedChange={(checked) =>
                  handleSettingsUpdate({ showViewAll: checked })
                }
              />
            </div>

            {section.settings.showViewAll && (
              <div className="space-y-2">
                <Label htmlFor="view-all-url" className="text-xs">View All URL</Label>
                <Input
                  id="view-all-url"
                  value={section.settings.viewAllUrl || ''}
                  onChange={(e) => handleSettingsUpdate({ viewAllUrl: e.target.value })}
                  placeholder="/products"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="layout-type" className="text-xs">Layout Type</Label>
              <Select
                value={section.settings.layout || 'grid'}
                onValueChange={(value: 'grid' | 'carousel' | 'list' | 'masonry') =>
                  handleSettingsUpdate({ layout: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="columns" className="text-xs">Columns</Label>
              <Input
                id="columns"
                type="number"
                min="1"
                max="12"
                value={section.settings.columns || 4}
                onChange={(e) =>
                  handleSettingsUpdate({ columns: parseInt(e.target.value) || 4 })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gap" className="text-xs">Gap</Label>
              <Input
                id="gap"
                value={section.settings.gap || '1rem'}
                onChange={(e) => handleSettingsUpdate({ gap: e.target.value })}
                placeholder="1rem"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit" className="text-xs">Item Limit</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                value={section.settings.limit || 8}
                onChange={(e) =>
                  handleSettingsUpdate({ limit: parseInt(e.target.value) || 8 })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-width" className="text-xs">Container Width</Label>
              <Select
                value={section.settings.containerWidth || 'boxed'}
                onValueChange={(value: 'full' | 'boxed' | 'custom') =>
                  handleSettingsUpdate({ containerWidth: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="boxed">Boxed</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {section.settings.containerWidth === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="max-width" className="text-xs">Max Width</Label>
                <Input
                  id="max-width"
                  value={section.settings.containerMaxWidth || ''}
                  onChange={(e) =>
                    handleSettingsUpdate({ containerMaxWidth: e.target.value })
                  }
                  placeholder="1200px"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="bg-color" className="text-xs">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={section.settings.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    handleSettingsUpdate({ backgroundColor: e.target.value })
                  }
                  className="h-8 w-16 p-1"
                />
                <Input
                  value={section.settings.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    handleSettingsUpdate({ backgroundColor: e.target.value })
                  }
                  placeholder="#ffffff"
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bg-image" className="text-xs">Background Image URL</Label>
              <Input
                id="bg-image"
                value={section.settings.backgroundImage || ''}
                onChange={(e) =>
                  handleSettingsUpdate({ backgroundImage: e.target.value })
                }
                placeholder="https://..."
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="padding-top" className="text-xs">Padding Top</Label>
                <Input
                  id="padding-top"
                  value={section.settings.padding?.top || '1rem'}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      padding: { ...section.settings.padding, top: e.target.value },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padding-bottom" className="text-xs">Padding Bottom</Label>
                <Input
                  id="padding-bottom"
                  value={section.settings.padding?.bottom || '1rem'}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      padding: { ...section.settings.padding, bottom: e.target.value },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padding-left" className="text-xs">Padding Left</Label>
                <Input
                  id="padding-left"
                  value={section.settings.padding?.left || '1rem'}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      padding: { ...section.settings.padding, left: e.target.value },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padding-right" className="text-xs">Padding Right</Label>
                <Input
                  id="padding-right"
                  value={section.settings.padding?.right || '1rem'}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      padding: { ...section.settings.padding, right: e.target.value },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-css" className="text-xs">Custom CSS</Label>
              <Textarea
                id="custom-css"
                value={section.customStyles?.customCSS || ''}
                onChange={(e) =>
                  handleUpdate({
                    customStyles: {
                      ...section.customStyles,
                      customCSS: e.target.value,
                    },
                  })
                }
                placeholder=".my-class { color: red; }"
                className="h-32 text-xs font-mono resize-none"
              />
            </div>
          </TabsContent>

          {/* Code Tab (Custom HTML/CSS) */}
          {section.type === 'custom-html-css' && (
            <TabsContent value="code" className="p-0 mt-0 h-[600px]">
              <CodeEditor
                html={section.customHtml || ''}
                css={section.customCss || ''}
                onHtmlChange={(html) => handleUpdate({ customHtml: html })}
                onCssChange={(css) => handleUpdate({ customCss: css })}
              />
            </TabsContent>
          )}

          {/* Data Tab */}
          <TabsContent value="data" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs">Data Source</Label>
              <Select
                value={section.dataBindings?.products?.source || 'recent'}
                onValueChange={(value: 'recent' | 'best_sellers' | 'featured' | 'custom') =>
                  handleUpdate({
                    dataBindings: {
                      ...section.dataBindings,
                      products: {
                        ...section.dataBindings?.products,
                        source: value,
                      },
                    },
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent Products</SelectItem>
                  <SelectItem value="best_sellers">Best Sellers</SelectItem>
                  <SelectItem value="featured">Featured Products</SelectItem>
                  <SelectItem value="custom">Custom Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {section.dataBindings?.products?.source === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="sort-by" className="text-xs">Sort By</Label>
                <Select
                  value={section.dataBindings?.products?.sortBy || 'created'}
                  onValueChange={(value: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created') =>
                    handleUpdate({
                      dataBindings: {
                        ...section.dataBindings,
                        products: {
                          ...section.dataBindings?.products,
                          sortBy: value,
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
});

SectionSettingsPanel.displayName = 'SectionSettingsPanel';
