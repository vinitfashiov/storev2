# GrapesJS Page Builder - Improvement Plan

## Current State Analysis:
- ✅ GrapesJS framework with plugins (webpage, blocks-basic, forms, custom-code, tabs, tooltip, typed)
- ✅ Basic e-commerce blocks (hero-section, product-grid, category-cards, testimonials, cta-banner, newsletter, features-grid, image-banner)
- ✅ Custom styling to match theme
- ✅ Device manager (desktop/tablet/mobile)
- ✅ Style manager with sectors (Layout, Size, Space, Position, Typography, Background, Borders, Effects)
- ❌ Product blocks are static HTML (not connected to real store products)
- ❌ No real data integration
- ❌ Custom HTML/CSS block exists but lacks advanced positioning controls
- ❌ No Header/Footer blocks
- ❌ Column system is basic (GrapesJS default)
- ❌ UI could be more modern

---

## Improvement List:

### 1. **Enhanced HTML/CSS Custom Block with Advanced Positioning**
**Current:** Basic custom code plugin
**Improvements:**
- Add advanced positioning controls in trait manager:
  - Position: static, relative, absolute, fixed, sticky
  - Top, Left, Right, Bottom inputs with units
  - Width, Height with units (px, %, vh, vw, rem)
  - Z-index control
  - Transform controls (translate, rotate, scale)
- Enhanced custom code editor with syntax highlighting
- Visual position indicator in canvas
- Separate "Code" and "Position" tabs in properties panel

### 2. **Column System - Enhanced & Stable**
**Current:** Basic GrapesJS column system
**Improvements:**
- Create custom "Columns" block with:
  - Visual grid builder
  - Drag-to-resize column widths
  - Column gap controls
  - Responsive breakpoints (mobile/tablet/desktop column configurations)
  - Column background colors per column
  - Nested columns support
  - Visual column dividers in canvas
- Better column management UI in properties panel

### 3. **Products Block - Real Store Integration**
**Current:** Static HTML product grid
**Improvements:**
- Replace static `product-grid` block with dynamic component:
  - Connect to `useStoreProducts` hook
  - Show real product cards with:
    - Actual product images
    - Product names
    - Real prices (with compare_at_price if available)
    - Stock status
    - Add to cart functionality (in preview/storefront)
  - Empty state handling:
    - If no products: Show "No products yet" message
    - Heading: "No products yet"
    - Subtitle: "Add products to your store to display them here"
    - CTA button: "Add Products" (links to admin products page)
  - Product filtering options:
    - Featured products
    - Recent products
    - Best sellers
    - On sale
    - By category
    - By brand
  - Layout options:
    - Grid (2, 3, 4 columns)
    - Carousel/slider
    - List view
- Create GrapesJS component type that fetches data dynamically

### 4. **Header & Footer Blocks with Custom HTML/CSS**
**Current:** Not available
**Improvements:**
- Add "Header" block:
  - Custom HTML/CSS editor
  - Position: fixed/sticky/static
  - Height controls
  - Background color/image
  - Z-index control
  - Preview in canvas
- Add "Footer" block:
  - Custom HTML/CSS editor
  - Background controls
  - Padding/margin controls
  - Preview in canvas
- Both blocks should be editable in GrapesJS editor

### 5. **UI/UX Improvements**
**Current:** Standard GrapesJS UI with custom styling
**Improvements:**
- Modern block library:
  - Better icon design
  - Category grouping with collapsible sections
  - Search functionality
  - Block preview thumbnails
  - Better hover effects
- Enhanced toolbar:
  - Better button styling
  - Tooltips for all actions
  - Keyboard shortcuts display
  - Save status indicator
- Canvas improvements:
  - Better element selection indicators
  - Smooth animations
  - Grid/snap-to-grid option
  - Zoom controls
  - Better visual feedback
- Properties panel:
  - Better form controls
  - Color picker integration
  - Image uploader integration
  - Better spacing controls
  - Tabbed interface improvements

### 6. **Ecommerce-Focused Components**
**Current:** Mix of e-commerce and general blocks
**Improvements:**
- Remove non-essential blocks:
  - Testimonials (not e-commerce focused)
  - Newsletter (can be replaced with better CTA)
  - Features Grid (not e-commerce specific)
- Add more e-commerce blocks:
  - **Real Product Grid** (with store data)
  - **Real Product Carousel** (with store data)
  - **Real Category Grid** (with store categories)
  - **Real Category Carousel**
  - **Featured Products** (dynamic)
  - **Sale Banner** (with countdown)
  - **Brand Showcase** (with real brands)
  - **Product Collection** (filtered products)
  - **Recently Viewed Products**
  - **Wishlist Section**
  - **Cart Summary Widget**
- Reorganize block categories:
  - Layout & Structure
  - Hero Sections
  - Products (all product-related blocks)
  - Categories & Brands
  - Promotions & Sales
  - Call to Action
  - Content
  - Custom Code

---

## Technical Implementation Details:

### For Real Products Integration:
- Create GrapesJS component type that uses React component
- Use GrapesJS `domComponents.addType()` to register custom component
- Component should fetch data using `useStoreProducts` hook
- Handle empty state gracefully
- Support filtering and layout options

### For Enhanced Custom HTML:
- Extend `gjsCustomCode` plugin
- Add custom traits for positioning
- Add custom style manager sectors for advanced positioning

### For Header/Footer:
- Create custom GrapesJS components
- Add to block manager
- Support HTML/CSS editing
- Add position controls in traits

### For Column System:
- Create custom "Columns" component type
- Add drag-to-resize functionality
- Support responsive breakpoints
- Visual grid builder UI

---

## Priority Order:
1. **Products Block Integration** (real store data) - HIGHEST
2. **Enhanced HTML/CSS Custom Block** - HIGH
3. **Header/Footer blocks** - HIGH
4. **Column System improvements** - MEDIUM
5. **UI/UX enhancements** - MEDIUM
6. **Ecommerce component cleanup** - LOW

---

## Expected Outcome:
- Fully functional GrapesJS page builder
- Real store data integration
- Advanced customization options
- E-commerce focused
- Modern, professional UI
- Stable and performant
