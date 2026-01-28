import { memo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Package, Tag, Image, Award, Type, Video, Mail, Clock, Users, Code } from 'lucide-react';
import { ThemeSectionType, SectionLibraryItem } from '@/types/themeEditor';
import { cn } from '@/lib/utils';
import { DraggableSection } from './DraggableSection';

// Section Library Items
const SECTION_LIBRARY: SectionLibraryItem[] = [
  // Products
  { type: 'products-grid', label: 'Products Grid', description: 'Display products in a grid layout', icon: 'Package', category: 'products' },
  { type: 'products-carousel', label: 'Products Carousel', description: 'Scrollable product slider', icon: 'Package', category: 'products' },
  { type: 'products-list', label: 'Products List', description: 'List view of products', icon: 'Package', category: 'products' },
  { type: 'products-masonry', label: 'Products Masonry', description: 'Pinterest-style layout', icon: 'Package', category: 'products' },
  { type: 'featured-products', label: 'Featured Products', description: 'Showcase featured products', icon: 'Package', category: 'products' },
  { type: 'best-sellers', label: 'Best Sellers', description: 'Top selling products', icon: 'Package', category: 'products' },
  { type: 'new-arrivals', label: 'New Arrivals', description: 'Latest products', icon: 'Package', category: 'products' },
  { type: 'on-sale', label: 'On Sale', description: 'Discounted products', icon: 'Package', category: 'products' },
  
  // Categories
  { type: 'categories-grid', label: 'Categories Grid', description: 'Category grid layout', icon: 'Tag', category: 'categories' },
  { type: 'categories-carousel', label: 'Categories Carousel', description: 'Scrollable categories', icon: 'Tag', category: 'categories' },
  { type: 'categories-list', label: 'Categories List', description: 'List of categories', icon: 'Tag', category: 'categories' },
  
  // Banners
  { type: 'banner-carousel', label: 'Banner Carousel', description: 'Image banner slider', icon: 'Image', category: 'banners' },
  { type: 'banner-grid', label: 'Banner Grid', description: 'Grid of promotional banners', icon: 'Image', category: 'banners' },
  { type: 'hero-banner', label: 'Hero Banner', description: 'Large hero section', icon: 'Image', category: 'banners' },
  
  // Brands
  { type: 'brands-showcase', label: 'Brands Showcase', description: 'Display brand logos', icon: 'Award', category: 'brands' },
  { type: 'brands-carousel', label: 'Brands Carousel', description: 'Scrollable brand logos', icon: 'Award', category: 'brands' },
  
  // Content
  { type: 'text-content', label: 'Text Content', description: 'Rich text content block', icon: 'Type', category: 'content' },
  { type: 'image-gallery', label: 'Image Gallery', description: 'Photo gallery', icon: 'Image', category: 'content' },
  { type: 'video-section', label: 'Video Section', description: 'Embed video content', icon: 'Video', category: 'content' },
  { type: 'testimonials', label: 'Testimonials', description: 'Customer reviews', icon: 'Users', category: 'content' },
  { type: 'newsletter-signup', label: 'Newsletter', description: 'Email subscription form', icon: 'Mail', category: 'content' },
  { type: 'countdown-timer', label: 'Countdown Timer', description: 'Sale countdown', icon: 'Clock', category: 'content' },
  { type: 'social-proof', label: 'Social Proof', description: 'Trust indicators', icon: 'Users', category: 'content' },
  
  // Custom
  { type: 'custom-html-css', label: 'Custom HTML/CSS', description: 'Full HTML/CSS editor', icon: 'Code', category: 'custom' },
];

const CATEGORIES = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'brands', label: 'Brands', icon: Award },
  { id: 'content', label: 'Content', icon: Type },
  { id: 'custom', label: 'Custom', icon: Code },
];

interface SectionLibraryProps {
  onAddSection?: (type: ThemeSectionType) => void;
}

export const SectionLibrary = memo(({ onAddSection }: SectionLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.map(c => c.id))
  );

  const filteredSections = SECTION_LIBRARY.filter(section =>
    section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSections = CATEGORIES.map(category => ({
    ...category,
    sections: filteredSections.filter(s => s.category === category.id),
  })).filter(cat => cat.sections.length > 0);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Package,
      Tag,
      Image,
      Award,
      Type,
      Video,
      Mail,
      Clock,
      Users,
      Code,
    };
    return iconMap[iconName] || Package;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groupedSections.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const Icon = category.icon;

            return (
              <div key={category.id} className="border rounded-lg overflow-hidden bg-card">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold">{category.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.sections.length})
                    </span>
                  </div>
                  <div className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded ? "rotate-90" : ""
                  )}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-muted/30">
                    {category.sections.map((section) => {
                      const SectionIcon = getIcon(section.icon);
                      return (
                        <DraggableSection
                          key={section.type}
                          section={section}
                          icon={SectionIcon}
                          onAdd={onAddSection}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});

SectionLibrary.displayName = 'SectionLibrary';
