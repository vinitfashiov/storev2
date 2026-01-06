import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Save, 
  Eye, 
  Trash2, 
  GripVertical, 
  X, 
  Edit2,
  Type,
  Image as ImageIcon,
  Package,
  Tag,
  Award,
  Code,
  Video,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Minus,
  ChevronLeft,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Copy,
  Upload,
  LayoutGrid,
  List,
  Play,
  Mail,
  HelpCircle,
  Hash,
  Clock,
  Grid3X3,
  Layers,
  FileText,
  Search,
  Check,
  History,
  Palette,
  Plus
} from 'lucide-react';
import { PageBuilderBlock, BlockType, HomepageLayout, BlockStyles } from '@/types/pageBuilder';
import { CanvasPreview } from '@/components/pageBuilder/CanvasPreview';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Block icons mapping
const BLOCK_ICONS: Record<string, any> = {
  hero: Sparkles,
  heroCentered: Sparkles,
  heroSplit: Sparkles,
  heroVideo: Play,
  products: Package,
  productsCarousel: Package,
  productsGrid: Grid3X3,
  categories: Tag,
  categoriesGrid: Grid3X3,
  brands: Award,
  brandsCarousel: Award,
  banner: ImageIcon,
  bannerSplit: Layers,
  customHtml: Code,
  text: Type,
  richText: FileText,
  heading: Type,
  image: ImageIcon,
  imageGallery: Grid3X3,
  video: Video,
  testimonial: MessageSquare,
  testimonials: MessageSquare,
  feature: Sparkles,
  features: LayoutGrid,
  cta: ArrowRight,
  ctaWithImage: ArrowRight,
  newsletter: Mail,
  faq: HelpCircle,
  stats: Hash,
  logoCloud: Award,
  contact: Mail,
  spacer: Minus,
  divider: Minus,
  countdown: Clock,
  collection: Package
};

// Default homepage content - shown when page builder is opened for the first time
const DEFAULT_HOMEPAGE_BLOCKS: PageBuilderBlock[] = [
  {
    id: uuidv4(),
    type: 'hero',
    order: 0,
    styles: {},
    data: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products at unbeatable prices. Shop the latest trends and find exactly what you need.',
      imageUrl: '',
      ctaText: 'Shop Now',
      ctaUrl: '/products',
      ctaSecondaryText: 'Learn More',
      ctaSecondaryUrl: '/about',
      overlay: true,
      overlayOpacity: 40
    }
  },
  {
    id: uuidv4(),
    type: 'categories',
    order: 1,
    styles: {},
    data: {
      title: 'Shop by Category',
      subtitle: 'Browse our wide selection of products',
      limit: 8,
      layout: 'grid',
      columns: 4
    }
  },
  {
    id: uuidv4(),
    type: 'products',
    order: 2,
    styles: {},
    data: {
      title: 'Featured Products',
      subtitle: 'Our top picks for you',
      collection: 'featured',
      limit: 8,
      layout: 'grid',
      columns: 4
    }
  },
  {
    id: uuidv4(),
    type: 'brands',
    order: 3,
    styles: {},
    data: {
      title: 'Our Brands',
      subtitle: 'Trusted by millions worldwide',
      limit: 6,
      layout: 'grid'
    }
  },
  {
    id: uuidv4(),
    type: 'cta',
    order: 4,
    styles: {},
    data: {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of happy customers today',
      buttonText: 'Shop Now',
      buttonUrl: '/products'
    }
  }
] as PageBuilderBlock[];

// Block categories for library
const BLOCK_CATEGORIES = [
  {
    id: 'hero',
    name: 'Hero Sections',
    blocks: [
      { type: 'hero' as BlockType, label: 'Hero Banner', description: 'Full-width hero with image and CTA' },
      { type: 'heroCentered' as BlockType, label: 'Centered Hero', description: 'Centered text with background' },
      { type: 'heroSplit' as BlockType, label: 'Split Hero', description: 'Side-by-side image and text' },
      { type: 'heroVideo' as BlockType, label: 'Video Hero', description: 'Hero with video background' },
    ]
  },
  {
    id: 'products',
    name: 'Products',
    blocks: [
      { type: 'products' as BlockType, label: 'Product Grid', description: 'Display products in a grid' },
      { type: 'productsCarousel' as BlockType, label: 'Product Carousel', description: 'Scrollable product row' },
      { type: 'collection' as BlockType, label: 'Collection', description: 'Products from collection' },
    ]
  },
  {
    id: 'categories',
    name: 'Categories & Brands',
    blocks: [
      { type: 'categories' as BlockType, label: 'Categories', description: 'Display category cards' },
      { type: 'brands' as BlockType, label: 'Brands', description: 'Brand logo grid' },
      { type: 'logoCloud' as BlockType, label: 'Logo Cloud', description: 'Partner/brand logos' },
    ]
  },
  {
    id: 'banners',
    name: 'Banners & CTAs',
    blocks: [
      { type: 'banner' as BlockType, label: 'Banner', description: 'Promotional banner' },
      { type: 'bannerSplit' as BlockType, label: 'Split Banner', description: 'Two-column banner' },
      { type: 'cta' as BlockType, label: 'Call to Action', description: 'CTA section' },
      { type: 'ctaWithImage' as BlockType, label: 'CTA with Image', description: 'CTA with side image' },
      { type: 'countdown' as BlockType, label: 'Countdown', description: 'Timer countdown' },
    ]
  },
  {
    id: 'content',
    name: 'Content',
    blocks: [
      { type: 'text' as BlockType, label: 'Text', description: 'Simple text block' },
      { type: 'richText' as BlockType, label: 'Rich Text', description: 'Formatted text content' },
      { type: 'heading' as BlockType, label: 'Heading', description: 'Section heading' },
      { type: 'image' as BlockType, label: 'Image', description: 'Single image' },
      { type: 'imageGallery' as BlockType, label: 'Image Gallery', description: 'Multiple images' },
      { type: 'video' as BlockType, label: 'Video', description: 'Embedded video' },
    ]
  },
  {
    id: 'social',
    name: 'Social Proof',
    blocks: [
      { type: 'testimonial' as BlockType, label: 'Testimonial', description: 'Single testimonial' },
      { type: 'testimonials' as BlockType, label: 'Testimonials', description: 'Multiple testimonials' },
      { type: 'stats' as BlockType, label: 'Stats', description: 'Number statistics' },
    ]
  },
  {
    id: 'features',
    name: 'Features',
    blocks: [
      { type: 'feature' as BlockType, label: 'Feature', description: 'Single feature highlight' },
      { type: 'features' as BlockType, label: 'Features Grid', description: 'Multiple features' },
      { type: 'faq' as BlockType, label: 'FAQ', description: 'Frequently asked questions' },
    ]
  },
  {
    id: 'forms',
    name: 'Forms & Contact',
    blocks: [
      { type: 'newsletter' as BlockType, label: 'Newsletter', description: 'Email signup form' },
      { type: 'contact' as BlockType, label: 'Contact', description: 'Contact information' },
    ]
  },
  {
    id: 'layout',
    name: 'Layout',
    blocks: [
      { type: 'spacer' as BlockType, label: 'Spacer', description: 'Vertical space' },
      { type: 'divider' as BlockType, label: 'Divider', description: 'Horizontal line' },
      { type: 'customHtml' as BlockType, label: 'Custom HTML', description: 'Custom code block' },
    ]
  },
];

// Create default block data
function createDefaultBlock(type: BlockType, order: number): PageBuilderBlock {
  const id = uuidv4();
  const baseBlock = { id, order, styles: {} as BlockStyles };

  switch (type) {
    case 'hero':
      return { ...baseBlock, type: 'hero', data: { title: 'Welcome to Our Store', subtitle: 'Discover amazing products at unbeatable prices', imageUrl: '', ctaText: 'Shop Now', ctaUrl: '/products', overlay: true, overlayOpacity: 50 } };
    case 'heroCentered':
      return { ...baseBlock, type: 'heroCentered', data: { title: 'New Collection', subtitle: 'Spring/Summer 2024', imageUrl: '', ctaText: 'Explore', ctaUrl: '/products' } };
    case 'heroSplit':
      return { ...baseBlock, type: 'heroSplit', data: { title: 'Quality Products', subtitle: 'Handcrafted with care', imageUrl: '', ctaText: 'View All', ctaUrl: '/products', imagePosition: 'right' } };
    case 'heroVideo':
      return { ...baseBlock, type: 'heroVideo', data: { title: 'Experience Excellence', subtitle: 'Watch our story', videoUrl: '', ctaText: 'Learn More', ctaUrl: '/about' } };
    case 'products':
    case 'productsCarousel':
    case 'productsGrid':
      return { ...baseBlock, type, data: { title: 'Featured Products', subtitle: 'Our top picks for you', collection: 'featured', limit: 8, layout: type === 'productsCarousel' ? 'carousel' : 'grid', columns: 4 } };
    case 'categories':
    case 'categoriesGrid':
      return { ...baseBlock, type, data: { title: 'Shop by Category', subtitle: 'Find what you need', limit: 8, layout: 'grid', columns: 4 } };
    case 'brands':
    case 'brandsCarousel':
      return { ...baseBlock, type, data: { title: 'Our Brands', subtitle: 'Trusted by millions', limit: 8, layout: type === 'brandsCarousel' ? 'carousel' : 'grid' } };
    case 'banner':
      return { ...baseBlock, type: 'banner', data: { title: 'Special Offer', subtitle: 'Limited time only', imageUrl: '', ctaText: 'Shop Now', ctaUrl: '/products', textPosition: 'center' } };
    case 'bannerSplit':
      return { ...baseBlock, type: 'bannerSplit', data: { leftTitle: 'New Arrivals', leftSubtitle: 'Check out the latest', leftImageUrl: '', leftCtaText: 'View', leftCtaUrl: '/new', rightTitle: 'Best Sellers', rightSubtitle: 'Popular products', rightImageUrl: '', rightCtaText: 'Shop', rightCtaUrl: '/bestsellers' } };
    case 'customHtml':
      return { ...baseBlock, type: 'customHtml', data: { html: '<div class="custom-block">Your custom HTML here</div>', css: '.custom-block { padding: 20px; text-align: center; }' } };
    case 'text':
      return { ...baseBlock, type: 'text', data: { content: 'Enter your text content here. This is a simple text block that you can use for paragraphs and descriptions.' } };
    case 'richText':
      return { ...baseBlock, type: 'richText', data: { content: '<p>Enter your <strong>rich text</strong> content here.</p>' } };
    case 'heading':
      return { ...baseBlock, type: 'heading', data: { text: 'Section Heading', level: 'h2', align: 'center' } };
    case 'image':
      return { ...baseBlock, type: 'image', data: { imageUrl: '', alt: 'Image description' } };
    case 'imageGallery':
      return { ...baseBlock, type: 'imageGallery', data: { images: [], columns: 3, gap: '1rem' } };
    case 'video':
      return { ...baseBlock, type: 'video', data: { videoUrl: '', autoplay: false, muted: true, loop: false } };
    case 'testimonial':
      return { ...baseBlock, type: 'testimonial', data: { quote: 'Amazing products and excellent service!', author: 'John Doe', authorTitle: 'Happy Customer', rating: 5 } };
    case 'testimonials':
      return { ...baseBlock, type: 'testimonials', data: { title: 'What Our Customers Say', testimonials: [{ quote: 'Great experience!', author: 'Jane Smith', rating: 5 }], layout: 'carousel' } };
    case 'feature':
      return { ...baseBlock, type: 'feature', data: { title: 'Fast Shipping', description: 'Free delivery on orders over $50', icon: 'truck' } };
    case 'features':
      return { ...baseBlock, type: 'features', data: { title: 'Why Choose Us', features: [{ title: 'Quality', description: 'Premium materials', icon: 'star' }, { title: 'Fast Delivery', description: 'Express shipping', icon: 'truck' }, { title: 'Support', description: '24/7 assistance', icon: 'headphones' }], columns: 3, layout: 'grid' } };
    case 'cta':
      return { ...baseBlock, type: 'cta', data: { title: 'Ready to Get Started?', subtitle: 'Join thousands of happy customers', buttonText: 'Shop Now', buttonUrl: '/products' } };
    case 'ctaWithImage':
      return { ...baseBlock, type: 'ctaWithImage', data: { title: 'Special Offer', subtitle: 'Get 20% off your first order', buttonText: 'Claim Offer', buttonUrl: '/products', imageUrl: '', imagePosition: 'right' } };
    case 'newsletter':
      return { ...baseBlock, type: 'newsletter', data: { title: 'Subscribe to Our Newsletter', subtitle: 'Get the latest updates and offers', buttonText: 'Subscribe', placeholder: 'Enter your email' } };
    case 'faq':
      return { ...baseBlock, type: 'faq', data: { title: 'Frequently Asked Questions', faqs: [{ question: 'How do I track my order?', answer: 'You can track your order through your account dashboard.' }, { question: 'What is your return policy?', answer: 'We offer 30-day returns on all items.' }] } };
    case 'stats':
      return { ...baseBlock, type: 'stats', data: { stats: [{ value: '10K', label: 'Happy Customers', suffix: '+' }, { value: '500', label: 'Products', suffix: '+' }, { value: '99', label: 'Satisfaction Rate', suffix: '%' }] } };
    case 'logoCloud':
      return { ...baseBlock, type: 'logoCloud', data: { title: 'Trusted By', logos: [] } };
    case 'contact':
      return { ...baseBlock, type: 'contact', data: { title: 'Contact Us', subtitle: 'We\'d love to hear from you', showPhone: true, showEmail: true, showAddress: true, showForm: false } };
    case 'spacer':
      return { ...baseBlock, type: 'spacer', data: { height: '60px', mobileHeight: '40px' } };
    case 'divider':
      return { ...baseBlock, type: 'divider', data: { style: 'solid', color: '#e5e7eb', width: '100%' } };
    case 'countdown':
      return { ...baseBlock, type: 'countdown', data: { title: 'Sale Ends In', endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), ctaText: 'Shop Now', ctaUrl: '/sale' } };
    case 'collection':
      return { ...baseBlock, type: 'collection', data: { title: 'Collection', limit: 8, layout: 'grid' } };
    default:
      return { ...baseBlock, type: 'text', data: { content: 'Unknown block type' } } as any;
  }
}

// Block Library Component
const BlockLibrary = memo(({ onAddBlock, searchQuery }: { onAddBlock: (type: BlockType) => void; searchQuery: string }) => {
  const filteredCategories = BLOCK_CATEGORIES.map(category => ({
    ...category,
    blocks: category.blocks.filter(block => 
      block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.blocks.length > 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {category.name}
            </h4>
            <div className="space-y-1">
              {category.blocks.map((block) => {
                const Icon = BLOCK_ICONS[block.type] || Package;
                return (
                  <button
                    key={block.type}
                    onClick={() => onAddBlock(block.type)}
                    className="w-full text-left p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-muted group-hover:bg-primary/10">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">{block.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{block.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
});

// Sortable Canvas Block - Shows live preview with drag handle
const SortableCanvasBlock = memo(({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  block: PageBuilderBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const Icon = BLOCK_ICONS[block.type] || Package;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Block toolbar - shown on hover/select */}
      <div className={cn(
        "absolute top-2 right-2 z-20 flex items-center gap-1 bg-background/95 rounded-lg shadow-lg border p-1 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <div
          className="cursor-grab active:cursor-grabbing p-1.5 rounded hover:bg-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="w-px h-4 bg-border" />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Block type badge */}
      <div className={cn(
        "absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-background/95 rounded-lg shadow-lg border px-2 py-1 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Icon className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium capitalize">{block.type.replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>

      {/* Canvas Preview - the actual visual block */}
      <CanvasPreview block={block} isSelected={isSelected} onClick={onSelect} />
    </div>
  );
});

// Block Editor Panel
const BlockEditorPanel = memo(({ block, onUpdate, onClose }: { 
  block: PageBuilderBlock; 
  onUpdate: (updates: Partial<PageBuilderBlock>) => void;
  onClose: () => void;
}) => {
  const updateData = (key: string, value: any) => {
    onUpdate({ data: { ...(block as any).data, [key]: value } } as any);
  };

  const updateStyle = (key: keyof BlockStyles, value: any) => {
    onUpdate({ styles: { ...block.styles, [key]: value } });
  };

  const renderDataEditor = () => {
    const data = (block as any).data;
    
    switch (block.type) {
      case 'hero':
      case 'heroCentered':
      case 'heroSplit':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={data.title || ''} onChange={(e) => updateData('title', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Textarea value={data.subtitle || ''} onChange={(e) => updateData('subtitle', e.target.value)} className="text-xs min-h-[60px]" />
            </div>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={data.imageUrl || ''} onChange={(e) => updateData('imageUrl', e.target.value)} className="h-8 text-xs" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Button Text</Label>
                <Input value={data.ctaText || ''} onChange={(e) => updateData('ctaText', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Button URL</Label>
                <Input value={data.ctaUrl || ''} onChange={(e) => updateData('ctaUrl', e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>
        );
      
      case 'products':
      case 'productsCarousel':
      case 'productsGrid':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={data.title || ''} onChange={(e) => updateData('title', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Input value={data.subtitle || ''} onChange={(e) => updateData('subtitle', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Collection</Label>
              <Select value={data.collection} onValueChange={(v) => updateData('collection', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="best_sellers">Best Sellers</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="sale">On Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Limit</Label>
                <Input type="number" value={data.limit || 8} onChange={(e) => updateData('limit', parseInt(e.target.value))} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Columns</Label>
                <Input type="number" value={data.columns || 4} onChange={(e) => updateData('columns', parseInt(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>
          </div>
        );

      case 'text':
      case 'richText':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea value={data.content || ''} onChange={(e) => updateData('content', e.target.value)} className="text-xs min-h-[120px]" />
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Text</Label>
              <Input value={data.text || ''} onChange={(e) => updateData('text', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={data.level} onValueChange={(v) => updateData('level', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Align</Label>
              <Select value={data.align || 'left'} onValueChange={(v) => updateData('align', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={data.imageUrl || ''} onChange={(e) => updateData('imageUrl', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Alt Text</Label>
              <Input value={data.alt || ''} onChange={(e) => updateData('alt', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Link URL (optional)</Label>
              <Input value={data.linkUrl || ''} onChange={(e) => updateData('linkUrl', e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        );

      case 'cta':
      case 'ctaWithImage':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={data.title || ''} onChange={(e) => updateData('title', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Textarea value={data.subtitle || ''} onChange={(e) => updateData('subtitle', e.target.value)} className="text-xs min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Button Text</Label>
                <Input value={data.buttonText || ''} onChange={(e) => updateData('buttonText', e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Button URL</Label>
                <Input value={data.buttonUrl || ''} onChange={(e) => updateData('buttonUrl', e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            {block.type === 'ctaWithImage' && (
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input value={data.imageUrl || ''} onChange={(e) => updateData('imageUrl', e.target.value)} className="h-8 text-xs" />
              </div>
            )}
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Height (Desktop)</Label>
              <Input value={data.height || '60px'} onChange={(e) => updateData('height', e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Height (Mobile)</Label>
              <Input value={data.mobileHeight || '40px'} onChange={(e) => updateData('mobileHeight', e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        );

      case 'customHtml':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">HTML</Label>
              <Textarea value={data.html || ''} onChange={(e) => updateData('html', e.target.value)} className="text-xs min-h-[100px] font-mono" />
            </div>
            <div>
              <Label className="text-xs">CSS</Label>
              <Textarea value={data.css || ''} onChange={(e) => updateData('css', e.target.value)} className="text-xs min-h-[100px] font-mono" />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            {Object.entries(data || {}).map(([key, value]) => (
              <div key={key}>
                <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                {typeof value === 'string' ? (
                  value.length > 50 ? (
                    <Textarea value={value} onChange={(e) => updateData(key, e.target.value)} className="text-xs min-h-[60px]" />
                  ) : (
                    <Input value={value} onChange={(e) => updateData(key, e.target.value)} className="h-8 text-xs" />
                  )
                ) : typeof value === 'number' ? (
                  <Input type="number" value={value} onChange={(e) => updateData(key, parseInt(e.target.value))} className="h-8 text-xs" />
                ) : null}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10">
            {(() => { const Icon = BLOCK_ICONS[block.type] || Package; return <Icon className="w-4 h-4 text-primary" />; })()}
          </div>
          <span className="font-medium text-sm capitalize">{block.type.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b h-9 p-0 bg-transparent">
          <TabsTrigger value="content" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Content</TabsTrigger>
          <TabsTrigger value="style" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Style</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-3">
              {renderDataEditor()}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="style" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-3 space-y-4">
              <div>
                <Label className="text-xs font-semibold">Padding</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['top', 'right', 'bottom', 'left'].map(side => (
                    <div key={side}>
                      <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
                      <Input
                        value={block.styles?.padding?.[side as keyof typeof block.styles.padding] || ''}
                        onChange={(e) => updateStyle('padding', { ...block.styles?.padding, [side]: e.target.value })}
                        placeholder="0px"
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-semibold">Margin</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['top', 'right', 'bottom', 'left'].map(side => (
                    <div key={side}>
                      <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
                      <Input
                        value={block.styles?.margin?.[side as keyof typeof block.styles.margin] || ''}
                        onChange={(e) => updateStyle('margin', { ...block.styles?.margin, [side]: e.target.value })}
                        placeholder="0px"
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-xs font-semibold">Background</Label>
                <Input
                  value={block.styles?.backgroundColor || ''}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff or rgba(...)"
                  className="h-8 text-xs mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs font-semibold">Text Align</Label>
                <Select value={block.styles?.textAlign || 'left'} onValueChange={(v) => updateStyle('textAlign', v as any)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Canvas Preview Block
const CanvasBlock = memo(({ block }: { block: PageBuilderBlock }) => {
  const data = (block as any).data;
  const styles = block.styles || {};
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor,
    padding: styles.padding ? `${styles.padding.top || 0} ${styles.padding.right || 0} ${styles.padding.bottom || 0} ${styles.padding.left || 0}` : undefined,
    textAlign: styles.textAlign,
  };

  switch (block.type) {
    case 'hero':
    case 'heroCentered':
    case 'heroSplit':
      return (
        <div style={containerStyle} className="relative min-h-[200px] bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center rounded-lg overflow-hidden">
          {data.imageUrl && <img src={data.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
          <div className="relative z-10 text-center p-6">
            <h2 className="text-2xl font-bold">{data.title}</h2>
            <p className="text-muted-foreground mt-2">{data.subtitle}</p>
            {data.ctaText && <Button className="mt-4" size="sm">{data.ctaText}</Button>}
          </div>
        </div>
      );
    
    case 'products':
    case 'productsCarousel':
    case 'productsGrid':
      return (
        <div style={containerStyle} className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">{data.title}</h3>
          {data.subtitle && <p className="text-sm text-muted-foreground mb-4">{data.subtitle}</p>}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: Math.min(data.limit || 4, 8) }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'categories':
    case 'categoriesGrid':
      return (
        <div style={containerStyle} className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">{data.title}</h3>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: Math.min(data.limit || 4, 8) }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'brands':
    case 'brandsCarousel':
      return (
        <div style={containerStyle} className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">{data.title}</h3>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                <Award className="w-6 h-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'text':
    case 'richText':
      return (
        <div style={containerStyle} className="p-4">
          <p className="text-sm">{data.content}</p>
        </div>
      );

    case 'heading':
      const HeadingTag = data.level || 'h2';
      return (
        <div style={containerStyle} className="p-4">
          <HeadingTag className={cn("font-bold", data.level === 'h1' ? 'text-3xl' : data.level === 'h2' ? 'text-2xl' : 'text-xl')}>
            {data.text}
          </HeadingTag>
        </div>
      );

    case 'image':
      return (
        <div style={containerStyle} className="p-4">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.alt} className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
      );

    case 'cta':
    case 'ctaWithImage':
      return (
        <div style={containerStyle} className="p-6 bg-primary/10 rounded-lg text-center">
          <h3 className="text-xl font-bold">{data.title}</h3>
          {data.subtitle && <p className="text-muted-foreground mt-2">{data.subtitle}</p>}
          <Button className="mt-4">{data.buttonText}</Button>
        </div>
      );

    case 'spacer':
      return <div style={{ height: data.height, ...containerStyle }} className="bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">Spacer ({data.height})</div>;

    case 'divider':
      return <div style={containerStyle} className="py-4"><hr style={{ borderStyle: data.style, borderColor: data.color }} /></div>;

    case 'customHtml':
      return (
        <div style={containerStyle} className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Code className="w-4 h-4" />
            <span>Custom HTML Block</span>
          </div>
        </div>
      );

    default:
      return (
        <div style={containerStyle} className="p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground capitalize">{block.type} Block</div>
        </div>
      );
  }
});

// Main Page Builder Component
export default function PageBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const tenantId = searchParams.get('tenant');
  const [blocks, setBlocks] = useState<PageBuilderBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<PageBuilderBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout>();

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch layout
  const { data: layoutData, isLoading } = useQuery({
    queryKey: ['homepage-layout', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('homepage_layouts' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Load initial data - use default blocks if no layout exists
  useEffect(() => {
    if (layoutData) {
      const sections = (layoutData as any).draft_data?.sections || (layoutData as any).layout_data?.sections || [];
      const initialBlocks = sections.length > 0 ? sections : DEFAULT_HOMEPAGE_BLOCKS;
      setBlocks(initialBlocks);
      setHistory([initialBlocks]);
      setHistoryIndex(0);
    } else if (!isLoading && tenantId) {
      // No layout exists, use default blocks
      setBlocks(DEFAULT_HOMEPAGE_BLOCKS);
      setHistory([DEFAULT_HOMEPAGE_BLOCKS]);
      setHistoryIndex(0);
    }
  }, [layoutData, isLoading, tenantId]);

  // History management
  const pushHistory = useCallback((newBlocks: PageBuilderBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIsDirty(true);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if (e.key === 'Delete' && selectedBlockId) {
        handleDeleteBlock(selectedBlockId);
      }
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedBlockId]);

  // Auto-save
  useEffect(() => {
    if (isDirty && tenantId) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        saveDraftMutation.mutate({ sections: blocks });
      }, 15000);
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [blocks, isDirty, tenantId]);

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (layout: HomepageLayout) => {
      if (!tenantId) throw new Error('No tenant');
      const { error } = await supabase
        .from('homepage_layouts' as any)
        .upsert({
          tenant_id: tenantId,
          draft_data: layout,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      setIsDirty(false);
      toast.success('Draft saved');
    },
    onError: (error: any) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (layout: HomepageLayout) => {
      if (!tenantId) throw new Error('No tenant');
      
      // Get current version
      const { data: current } = await supabase
        .from('homepage_layouts' as any)
        .select('version')
        .eq('tenant_id', tenantId)
        .single();
      
      const currentVersion = (current as any)?.version || 0;
      const newVersion = currentVersion + 1;
      
      // Save version history
      await supabase.from('layout_versions' as any).insert({
        tenant_id: tenantId,
        layout_data: layout as any,
        version: newVersion,
      });
      
      // Update main layout
      const { error } = await supabase
        .from('homepage_layouts' as any)
        .upsert({
          tenant_id: tenantId,
          layout_data: layout,
          draft_data: layout,
          published_at: new Date().toISOString(),
          version: newVersion,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setIsDirty(false);
      toast.success('Published successfully!');
      queryClient.invalidateQueries({ queryKey: ['homepage-layout', tenantId] });
    },
    onError: (error: any) => {
      toast.error('Failed to publish: ' + error.message);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, i) => ({ ...block, order: i }));
      setBlocks(newBlocks);
      pushHistory(newBlocks);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type, blocks.length);
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...JSON.parse(JSON.stringify(block)), id: uuidv4() };
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)].map((b, i) => ({ ...b, order: i }));
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (id: string, updates: Partial<PageBuilderBlock>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } as PageBuilderBlock : b);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate({ sections: blocks });
  };

  const handlePublish = () => {
    publishMutation.mutate({ sections: blocks });
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No store selected</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-semibold">Page Builder</h1>
          {isDirty && <span className="text-xs text-muted-foreground">(unsaved)</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center border rounded-lg p-0.5">
            {[
              { device: 'desktop' as const, icon: Monitor },
              { device: 'tablet' as const, icon: Tablet },
              { device: 'mobile' as const, icon: Smartphone }
            ].map(({ device, icon: Icon }) => (
              <Button
                key={device}
                variant={previewDevice === device ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPreviewDevice(device)}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            ))}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Undo/Redo */}
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} className="h-8 w-8 p-0">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="h-8 w-8 p-0">
            <Redo2 className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Preview */}
          <Button variant={previewMode ? 'secondary' : 'outline'} size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          
          {/* Save */}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          
          {/* Publish */}
          <Button size="sm" onClick={handlePublish} disabled={publishMutation.isPending}>
            <Check className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Block Library */}
        {!previewMode && (
          <div className="w-64 border-r bg-card flex flex-col flex-shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
            <BlockLibrary onAddBlock={handleAddBlock} searchQuery={searchQuery} />
          </div>
        )}

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          <div 
            className="mx-auto bg-background rounded-lg shadow-sm min-h-full transition-all duration-300"
            style={{ maxWidth: deviceWidths[previewDevice] }}
          >
            {previewMode ? (
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="space-y-0">
                  {blocks.sort((a, b) => a.order - b.order).map(block => (
                    <CanvasPreview key={block.id} block={block} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    <div className="min-h-[400px]">
                      {blocks.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p className="font-medium">Start building your page</p>
                          <p className="text-sm">Add blocks from the library on the left</p>
                        </div>
                      )}
                      {blocks.sort((a, b) => a.order - b.order).map(block => (
                        <SortableCanvasBlock
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockId === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onDelete={() => handleDeleteBlock(block.id)}
                          onDuplicate={() => handleDuplicateBlock(block.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        {!previewMode && selectedBlock && (
          <div className="w-80 border-l flex-shrink-0">
            <BlockEditorPanel
              block={selectedBlock}
              onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
              onClose={() => setSelectedBlockId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
