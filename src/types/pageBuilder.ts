// Page Builder Types - Comprehensive Block System

export type BlockType = 
  | 'hero'
  | 'heroCentered'
  | 'heroSplit'
  | 'heroVideo'
  | 'products'
  | 'productsCarousel'
  | 'productsGrid'
  | 'categories'
  | 'categoriesGrid'
  | 'brands'
  | 'brandsCarousel'
  | 'banner'
  | 'bannerSplit'
  | 'customHtml'
  | 'text'
  | 'richText'
  | 'heading'
  | 'image'
  | 'imageGallery'
  | 'video'
  | 'testimonial'
  | 'testimonials'
  | 'feature'
  | 'features'
  | 'cta'
  | 'ctaWithImage'
  | 'newsletter'
  | 'faq'
  | 'stats'
  | 'logoCloud'
  | 'contact'
  | 'spacer'
  | 'divider'
  | 'countdown'
  | 'collection';

export type DeviceVisibility = {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
};

export interface BlockStyles {
  width?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  padding?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  boxShadow?: string;
  visibility?: DeviceVisibility;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  styles: BlockStyles;
  order: number;
  label?: string;
}

// Hero Blocks
export interface HeroBlock extends BaseBlock {
  type: 'hero';
  data: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    ctaSecondaryText?: string;
    ctaSecondaryUrl?: string;
    overlay?: boolean;
    overlayOpacity?: number;
    textColor?: string;
  };
}

export interface HeroCenteredBlock extends BaseBlock {
  type: 'heroCentered';
  data: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    badge?: string;
  };
}

export interface HeroSplitBlock extends BaseBlock {
  type: 'heroSplit';
  data: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    imagePosition: 'left' | 'right';
  };
}

export interface HeroVideoBlock extends BaseBlock {
  type: 'heroVideo';
  data: {
    title: string;
    subtitle: string;
    videoUrl: string;
    ctaText: string;
    ctaUrl: string;
    posterUrl?: string;
  };
}

// Product Blocks
export interface ProductsBlock extends BaseBlock {
  type: 'products' | 'productsCarousel' | 'productsGrid';
  data: {
    title: string;
    subtitle?: string;
    collection: 'featured' | 'recent' | 'best_sellers' | 'trending' | 'sale';
    limit: number;
    layout: 'grid' | 'carousel';
    columns?: number;
    showPrice?: boolean;
    showRating?: boolean;
  };
}

// Category Blocks
export interface CategoriesBlock extends BaseBlock {
  type: 'categories' | 'categoriesGrid';
  data: {
    title: string;
    subtitle?: string;
    limit: number;
    layout: 'grid' | 'carousel' | 'list';
    columns?: number;
    showCount?: boolean;
  };
}

// Brand Blocks
export interface BrandsBlock extends BaseBlock {
  type: 'brands' | 'brandsCarousel';
  data: {
    title: string;
    subtitle?: string;
    limit: number;
    layout: 'grid' | 'carousel';
  };
}

// Banner Blocks
export interface BannerBlock extends BaseBlock {
  type: 'banner';
  data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    ctaText?: string;
    ctaUrl?: string;
    textPosition: 'left' | 'center' | 'right';
  };
}

export interface BannerSplitBlock extends BaseBlock {
  type: 'bannerSplit';
  data: {
    leftTitle: string;
    leftSubtitle?: string;
    leftImageUrl: string;
    leftCtaText?: string;
    leftCtaUrl?: string;
    rightTitle: string;
    rightSubtitle?: string;
    rightImageUrl: string;
    rightCtaText?: string;
    rightCtaUrl?: string;
  };
}

// Custom HTML Block
export interface CustomHtmlBlock extends BaseBlock {
  type: 'customHtml';
  data: {
    html: string;
    css: string;
  };
}

// Text Blocks
export interface TextBlock extends BaseBlock {
  type: 'text';
  data: {
    content: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
  };
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  data: {
    content: string;
  };
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  data: {
    text: string;
    level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    align?: 'left' | 'center' | 'right';
  };
}

// Image Blocks
export interface ImageBlock extends BaseBlock {
  type: 'image';
  data: {
    imageUrl: string;
    alt: string;
    linkUrl?: string;
    caption?: string;
  };
}

export interface ImageGalleryBlock extends BaseBlock {
  type: 'imageGallery';
  data: {
    images: Array<{
      url: string;
      alt: string;
      caption?: string;
    }>;
    columns: number;
    gap: string;
  };
}

// Video Block
export interface VideoBlock extends BaseBlock {
  type: 'video';
  data: {
    videoUrl: string;
    thumbnailUrl?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    title?: string;
  };
}

// Testimonial Blocks
export interface TestimonialBlock extends BaseBlock {
  type: 'testimonial';
  data: {
    quote: string;
    author: string;
    authorTitle?: string;
    avatarUrl?: string;
    rating?: number;
  };
}

export interface TestimonialsBlock extends BaseBlock {
  type: 'testimonials';
  data: {
    title?: string;
    testimonials: Array<{
      quote: string;
      author: string;
      authorTitle?: string;
      avatarUrl?: string;
      rating?: number;
    }>;
    layout: 'grid' | 'carousel';
  };
}

// Feature Blocks
export interface FeatureBlock extends BaseBlock {
  type: 'feature';
  data: {
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
  };
}

export interface FeaturesBlock extends BaseBlock {
  type: 'features';
  data: {
    title?: string;
    subtitle?: string;
    features: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    columns: number;
    layout: 'grid' | 'list';
  };
}

// CTA Blocks
export interface CtaBlock extends BaseBlock {
  type: 'cta';
  data: {
    title: string;
    subtitle?: string;
    buttonText: string;
    buttonUrl: string;
    buttonSecondaryText?: string;
    buttonSecondaryUrl?: string;
    backgroundColor?: string;
  };
}

export interface CtaWithImageBlock extends BaseBlock {
  type: 'ctaWithImage';
  data: {
    title: string;
    subtitle?: string;
    buttonText: string;
    buttonUrl: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
  };
}

// Newsletter Block
export interface NewsletterBlock extends BaseBlock {
  type: 'newsletter';
  data: {
    title: string;
    subtitle?: string;
    buttonText: string;
    placeholder?: string;
    backgroundColor?: string;
  };
}

// FAQ Block
export interface FaqBlock extends BaseBlock {
  type: 'faq';
  data: {
    title?: string;
    subtitle?: string;
    faqs: Array<{
      question: string;
      answer: string;
    }>;
  };
}

// Stats Block
export interface StatsBlock extends BaseBlock {
  type: 'stats';
  data: {
    title?: string;
    stats: Array<{
      value: string;
      label: string;
      prefix?: string;
      suffix?: string;
    }>;
  };
}

// Logo Cloud Block
export interface LogoCloudBlock extends BaseBlock {
  type: 'logoCloud';
  data: {
    title?: string;
    logos: Array<{
      imageUrl: string;
      alt: string;
      linkUrl?: string;
    }>;
  };
}

// Contact Block
export interface ContactBlock extends BaseBlock {
  type: 'contact';
  data: {
    title: string;
    subtitle?: string;
    showPhone?: boolean;
    showEmail?: boolean;
    showAddress?: boolean;
    showForm?: boolean;
  };
}

// Spacer Block
export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  data: {
    height: string;
    mobileHeight?: string;
  };
}

// Divider Block
export interface DividerBlock extends BaseBlock {
  type: 'divider';
  data: {
    style: 'solid' | 'dashed' | 'dotted';
    color?: string;
    width?: string;
  };
}

// Countdown Block
export interface CountdownBlock extends BaseBlock {
  type: 'countdown';
  data: {
    title: string;
    subtitle?: string;
    endDate: string;
    ctaText?: string;
    ctaUrl?: string;
  };
}

// Collection Block
export interface CollectionBlock extends BaseBlock {
  type: 'collection';
  data: {
    title: string;
    subtitle?: string;
    collectionId?: string;
    layout: 'grid' | 'carousel';
    limit: number;
  };
}

export type PageBuilderBlock = 
  | HeroBlock
  | HeroCenteredBlock
  | HeroSplitBlock
  | HeroVideoBlock
  | ProductsBlock
  | CategoriesBlock
  | BrandsBlock
  | BannerBlock
  | BannerSplitBlock
  | CustomHtmlBlock
  | TextBlock
  | RichTextBlock
  | HeadingBlock
  | ImageBlock
  | ImageGalleryBlock
  | VideoBlock
  | TestimonialBlock
  | TestimonialsBlock
  | FeatureBlock
  | FeaturesBlock
  | CtaBlock
  | CtaWithImageBlock
  | NewsletterBlock
  | FaqBlock
  | StatsBlock
  | LogoCloudBlock
  | ContactBlock
  | SpacerBlock
  | DividerBlock
  | CountdownBlock
  | CollectionBlock;

export interface HomepageLayout {
  sections: PageBuilderBlock[];
}

// Template Types
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'fashion' | 'grocery' | 'electronics' | 'general' | 'minimal';
  blocks: PageBuilderBlock[];
}

// Block category for library organization
export interface BlockCategory {
  id: string;
  name: string;
  icon: string;
  blocks: Array<{
    type: BlockType;
    label: string;
    description: string;
    icon: string;
  }>;
}
