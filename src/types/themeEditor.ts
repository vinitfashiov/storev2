// Theme Editor Type Definitions

// Section Types
export type ThemeSectionType = 
  // Product Sections
  | 'products-grid'
  | 'products-carousel'
  | 'products-list'
  | 'products-masonry'
  | 'featured-products'
  | 'best-sellers'
  | 'new-arrivals'
  | 'on-sale'
  
  // Category Sections
  | 'categories-grid'
  | 'categories-carousel'
  | 'categories-list'
  
  // Banner Sections
  | 'banner-carousel'
  | 'banner-grid'
  | 'hero-banner'
  
  // Brand Sections
  | 'brands-showcase'
  | 'brands-carousel'
  
  // Content Sections
  | 'text-content'
  | 'image-gallery'
  | 'video-section'
  | 'testimonials'
  | 'newsletter-signup'
  | 'countdown-timer'
  | 'social-proof'
  
  // Custom Section
  | 'custom-html-css';

// Device Visibility
export interface DeviceVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

// Padding/Margin Configuration
export interface SpacingConfig {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

// Section Settings
export interface ThemeSectionSettings {
  // Layout Settings
  layout?: 'grid' | 'carousel' | 'list' | 'masonry';
  columns?: number;
  gap?: string;
  limit?: number;
  
  // Display Settings
  showTitle?: boolean;
  showSubtitle?: boolean;
  showViewAll?: boolean;
  viewAllUrl?: string;
  
  // Style Settings
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  padding?: SpacingConfig;
  margin?: SpacingConfig;
  borderRadius?: string;
  boxShadow?: string;
  
  // Responsive Settings
  visibility?: DeviceVisibility;
  containerWidth?: 'full' | 'boxed' | 'custom';
  containerMaxWidth?: string;
}

// Data Bindings
export interface ProductsDataBinding {
  source: 'recent' | 'best_sellers' | 'featured' | 'custom';
  categoryId?: string;
  brandId?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created';
  limit?: number;
}

export interface CategoriesDataBinding {
  source: 'all' | 'featured' | 'custom';
  categoryIds?: string[];
  limit?: number;
}

export interface BannersDataBinding {
  source: 'all' | 'featured' | 'custom';
  bannerIds?: string[];
  limit?: number;
}

export interface BrandsDataBinding {
  source: 'all' | 'featured' | 'custom';
  brandIds?: string[];
  limit?: number;
}

export interface ThemeSectionDataBindings {
  products?: ProductsDataBinding;
  categories?: CategoriesDataBinding;
  banners?: BannersDataBinding;
  brands?: BrandsDataBinding;
}

// Custom Styles
export interface CustomStyles {
  customCSS?: string;
  animations?: {
    onScroll?: string;
    onHover?: string;
    onLoad?: string;
  };
}

// Theme Section
export interface ThemeSection {
  id: string;
  type: ThemeSectionType;
  order: number;
  title?: string;
  subtitle?: string;
  settings: ThemeSectionSettings;
  dataBindings?: ThemeSectionDataBindings;
  customHtml?: string;
  customCss?: string;
  customStyles?: CustomStyles;
}

// Header Configuration
export interface HeaderConfig {
  type: 'default' | 'custom';
  config: {
    logoPosition: 'left' | 'center';
    menuPosition: 'center' | 'right';
    showSearch: boolean;
    showCart: boolean;
    showWishlist: boolean;
    showAccount: boolean;
    sticky: boolean;
    backgroundColor: string;
    textColor: string;
  };
}

// Footer Configuration
export interface FooterConfig {
  type: 'default' | 'custom';
  config: {
    showLinks: boolean;
    showSocial: boolean;
    showNewsletter: boolean;
    backgroundColor: string;
    textColor: string;
  };
}

// Theme Layout Data
export interface ThemeLayoutData {
  header: HeaderConfig;
  footer: FooterConfig;
  sections: ThemeSection[];
}

// Theme Layout (Database Model)
export interface ThemeLayout {
  id: string;
  tenant_id: string;
  layout_name: string;
  layout_data: ThemeLayoutData;
  is_published: boolean;
  published_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Section Template (for future)
export interface SectionTemplate {
  id: string;
  tenant_id: string | null;
  template_name: string;
  template_type: string;
  html_code: string | null;
  css_code: string | null;
  preview_image_url: string | null;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Section Library Item
export interface SectionLibraryItem {
  type: ThemeSectionType;
  label: string;
  description: string;
  icon: string; // Icon name or component
  category: 'products' | 'categories' | 'banners' | 'brands' | 'content' | 'custom';
  previewImage?: string;
}
