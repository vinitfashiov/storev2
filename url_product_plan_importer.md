# URL Product Importer - Development Roadmap

## Overview
The goal of this feature is to allow users to easily import product details (title, description, images, prices, variants) by simply pasting a product URL from another e-commerce website. This minimizes manual data entry and streamlines the store setup process.

## Phase 1: Research & Tool Selection
- **Target Platforms:** Identify which platforms to support initially (e.g., generic Shopify stores, WooCommerce, or specific marketplaces like Amazon/Flipkart). *Note: Large marketplaces often have heavy anti-scraping protections.*
- **Scraping Approach:** 
  - *Option A: Third-Party Scraper APIs (Recommended)* - Services like Apify, ScraperAPI, or BrightData. They handle proxy rotation, captchas, and headless browser rendering out of the box.
  - *Option B: Custom Edge Function* - Using tools like Cheerio (for static HTML) or LLMs for smart extraction. This is cheaper but harder to maintain if sites block the IP.
- **Data Mapping:** Define how scraped data attributes map to our database's `products` and `product_variants` schema.

## Phase 2: Backend & Infrastructure
1. **API Endpoint Creation:** Create a new Supabase Edge Function (e.g., `import-product-url`) that accepts a target URL securely.
2. **Extraction Logic:** 
   - Fetch the target page content.
   - Look for standard structured data (JSON-LD, OpenGraph tags) which many e-commerce sites use.
   - Extract core fields: `Title`, `Description` (HTML/Text), `Price`, `Images` (array of URLs), and `Variants` (sizes, colors).
3. **Image Processing:**
   - Download the external images to our Supabase Storage bucket to avoid hotlinking issues (external sites blocking our images or deleting them later).
   - Replace the scraped external image URLs with our new internal Supabase storage URLs.
4. **Data Normalization:** Return a uniformly structured JSON object representing the expected state of a new product.

## Phase 3: Frontend UI/UX Integration
1. **Entry Point:** Add an "Import via URL" button on the main "Products" page next to the standard "Add Product" button.
2. **Import Dialog:** 
   - A clean modal where the user pastes the URL.
   - Basic frontend URL validation before submission.
3. **Loading State:** A skeleton loader or progress indicator with engaging text (e.g., "Analyzing page...", "Downloading images...").
4. **Review Screen (Crucial):** Instead of saving directly to the database behind the scenes, the system should populate the existing "Add Product" form with the scraped data. This allows the user to review the information, edit formatting, fix mistakes, and then explicitly click "Save".

## Phase 4: Edge Cases & Error Handling
- **Timeouts:** Web scraping can take several seconds. Implement appropriate timeout handling and UI indicators.
- **Missing Data:** If the scraper can't find a price or variants, gracefully fallback and leave those fields blank in the review form for manual entry.
- **Anti-Bot Blocking:** Handle scenarios where the target site blocks the request. Show a user-friendly error: *"Unable to automatically import from this website. Please enter the details manually."*
- **Security:** Sanitize any scraped HTML descriptions to prevent XSS (Cross-Site Scripting) attacks before rendering them in the Rich Text Editor or saving to the database.

## System Architecture Flow
1. **User** pastes URL in Dashboard UI -> Clicks Import.
2. **Frontend** calls Supabase Edge Function `import-product`.
3. **Edge Function** fetches page or delegates to a Scraper API.
4. **Scraper** returns raw product data.
5. **Edge Function** downloads images to Supabase Storage & maps data to our schema.
6. **Edge Function** returns normalized Product object to Frontend.
7. **Frontend** pre-fills the "Add Product" form with the object.
8. **User** reviews data and clicks "Save" -> Standard product database creation executes.
