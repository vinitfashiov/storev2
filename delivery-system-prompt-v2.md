# Delivery & Shipping System — Complete Development Spec

## Overview

We need to build a comprehensive delivery fee management system for **two ecommerce modules**:

1. **D2C Ecommerce** — Direct to consumer online store
2. **Grocery Ecommerce** — Grocery delivery store

Both modules share some common delivery features, but each has its own specific logic. All delivery configurations are managed from their respective **Delivery Settings** pages in the admin panel.

**IMPORTANT:** This document is a feature spec and business logic guide. No code samples are included intentionally — the development team should implement based on the logic, rules, UI wireframes, and database structure described here.

---

## COMMON FEATURES (Both D2C & Grocery)

---

### Feature 1: Fixed Delivery Fee

**What:** A single flat delivery fee applied once per order, regardless of cart contents.

**Admin Panel:**
- Location: Delivery Settings page
- Fields:
  - `fixed_delivery_fee_enabled` — Toggle ON/OFF
  - `fixed_delivery_fee` — Number input (currency, e.g., ₹100)
- When enabled, this fee is applied to every order unless overridden by other rules (product-wise, free delivery threshold, etc.)

**Storefront Logic:**
- Checkout: Show fixed delivery fee in order summary
- If other fee types override it (product-wise, weight-based, etc.), the fixed fee is used only as a fallback for products/items that don't have a specific fee assigned

---

### Feature 2: Free Delivery Threshold

**What:** Orders above a certain cart value get free delivery (all delivery fees waived).

**Admin Panel:**
- Location: Delivery Settings page
- Fields:
  - `free_delivery_enabled` — Toggle ON/OFF
  - `free_delivery_threshold` — Number input (currency, e.g., ₹500)

**Storefront Logic:**
- If cart total is equal to or above the threshold → delivery fee becomes ₹0
- This overrides ALL other delivery fee calculations (fixed, product-wise, weight-based, area-wise, distance-based)
- Display on storefront:
  - Product pages: "Free delivery on orders above ₹{threshold}"
  - Cart page: "Add ₹{remaining} more for free delivery!" (if below threshold)
  - Checkout: "Free Delivery ✓" (if threshold met)

---

### Feature 3: Minimum Order Value

**What:** Orders below a certain cart value cannot be placed.

**Admin Panel:**
- Location: Delivery Settings page
- Fields:
  - `minimum_order_enabled` — Toggle ON/OFF
  - `minimum_order_value` — Number input (currency, e.g., ₹200)

**Storefront Logic:**
- If cart total is below the minimum → Block checkout
- Show message: "Minimum order value is ₹{amount}. Please add ₹{remaining} more to place your order."
- The checkout/place order button should be disabled with this message visible
- Cart page should also show this warning

---

### Feature 4: Max Delivery Fee Cap

**What:** A ceiling on the total delivery fee per order. Prevents delivery fees from stacking too high when multiple fee types combine.

**Admin Panel:**
- Location: Delivery Settings page
- Fields:
  - `max_delivery_fee_enabled` — Toggle ON/OFF
  - `max_delivery_fee` — Number input (currency, e.g., ₹150)

**Storefront Logic:**
- After calculating total delivery fee from all applicable rules, if the total exceeds the cap → cap it to the max amount
- This is applied BEFORE the free delivery threshold check
- Display: If capped, show "Delivery fee: ₹{max}" (no need to show original calculated amount)

---

## D2C ECOMMERCE — SPECIFIC FEATURES

---

### Feature 5: Product-Wise Delivery Fee

**What:** Individual products can have their own delivery fee, overriding the fixed fee for that specific product.

**Admin Panel:**

*Product Add Page:*
- Add a new section/field group: **"Shipping & Delivery"**
- Fields:
  - `product_delivery_fee_enabled` — Toggle ON/OFF (per product)
  - `product_delivery_fee` — Number input (currency, optional)
  - `product_weight` — Number input (kg) ← (also used by weight-based delivery, see Feature 6)
  - `product_dimensions` — Length × Width × Height (cm, all optional)

*Product Edit Page:*
- Same fields as above, pre-filled with existing values
- Admin can add/edit/remove product-wise delivery fee and weight/dimensions at any time

*Existing Products:*
- For all existing products, these new fields default to empty/null
- Admin can bulk-edit or individually update products to add weight, dimensions, and product-wise delivery fees

**Override Logic:**
- Product-wise delivery fee is charged **once per unique product in cart** (NOT per quantity)
- If a product has product_delivery_fee set → use that fee for this product
- If a product does NOT have product_delivery_fee set → fall back to fixed delivery fee (if enabled)
- Both can coexist in the same order

**Example:**
```
Cart:
  Product A (qty: 3, product_delivery_fee: ₹50) → ₹50 (once, not 3×50)
  Product B (qty: 2, product_delivery_fee: null) → uses fixed fee
  Product C (qty: 1, product_delivery_fee: ₹30) → ₹30

Fixed delivery fee: ₹100

Delivery calculation:
  Product A: ₹50
  Product B: ₹100 (fixed fee, because at least one product uses fixed)
  Product C: ₹30
  Total: ₹180

If max_delivery_fee = ₹150 → Total: ₹150 (capped)
If cart_total >= free_delivery_threshold → Total: ₹0
```

**Storefront — Single Product Page:**
- If product has product_delivery_fee → Show: "Delivery: ₹{product_fee}"
- If product has no product_delivery_fee and fixed fee is enabled → Show: "Delivery: ₹{fixed_fee}"
- If free delivery threshold is enabled → Show: "Free delivery on orders above ₹{threshold}"

**Storefront — Cart & Checkout:**
- Show delivery fee breakdown per product (or summarized total)
- Apply override logic as described above

---

### Feature 6: Weight-Based Delivery Fee (D2C)

**What:** Delivery fee calculated based on total cart weight. Admin can choose between TWO calculation types:

#### Calculation Type Options (Admin chooses ONE):

**Type A — Slab-Based:**
Admin defines weight range slabs, each with a fixed fee. The total cart weight falls into one slab and that slab's fee is charged.

```
Example Slabs:
  0 kg  — 1 kg   → ₹40
  1 kg  — 3 kg   → ₹70
  3 kg  — 5 kg   → ₹100
  5 kg  — 10 kg  → ₹150
  10 kg — above   → ₹250

Cart weight: 3.4 kg → Falls in "3-5 kg" slab → Delivery fee: ₹100
```

**Type B — Per KG (Fixed Rate):**
Admin sets a single rate per kilogram. The total cart weight is multiplied by this rate.

```
Example:
  Rate: ₹70 per kg

  Cart weight: 3.4 kg → 3.4 × ₹70 = ₹238 delivery fee
  Cart weight: 0.5 kg → 0.5 × ₹70 = ₹35 delivery fee
```

**Admin Panel:**
- Location: Delivery Settings page
- Fields:
  - `weight_based_delivery_enabled` — Toggle ON/OFF
  - `weight_calculation_type` — Dropdown/Radio: "Slab-Based" or "Per KG Rate"
  - **If Slab-Based selected:**
    - Weight slabs (dynamic table, admin can add/remove rows):
      - Each row: `min_weight` (kg), `max_weight` (kg), `delivery_fee` (₹)
      - "Add Slab" button to add more rows
      - Delete icon to remove a slab
      - Admin can add unlimited slabs
  - **If Per KG Rate selected:**
    - `per_kg_rate` — Single number input (₹ per kg, e.g., ₹70)

**Product Weight & Dimensions Requirement:**
- This feature depends on products having weight populated
- On the Product Add/Edit page (under the "Shipping & Delivery" section from Feature 5):
  - `product_weight` — Number input in kg (e.g., 0.5, 1.2, 5)
  - `product_dimensions` — Length (cm) × Width (cm) × Height (cm) — all three fields, optional, for future use
- These fields must be present on BOTH the product add form and product edit form
- For existing products already in the system, these fields default to empty/null — admin can update them at any time by editing the product
- If a product has no weight set and weight-based delivery is enabled, treat that product's weight as 0
- Show a warning on the admin panel if weight-based delivery is enabled but products have missing weights

**Storefront Logic:**
- Calculate total cart weight = sum of (each product's weight × its quantity)
- If Type A (Slab): Find the slab where total weight falls → charge that slab's fee
- If Type B (Per KG): Multiply total weight × per_kg_rate → that's the fee
- Display on checkout: "Delivery fee (based on weight: {total_weight} kg): ₹{fee}"

**Example (Per KG):**
```
Per KG rate: ₹70/kg

Cart:
  Product A (weight: 0.5kg, qty: 2) → 1.0 kg
  Product B (weight: 1.5kg, qty: 1) → 1.5 kg
  Product C (weight: 0.3kg, qty: 3) → 0.9 kg

Total weight: 3.4 kg
Delivery fee: 3.4 × ₹70 = ₹238
```

**Example (Slab-Based):**
```
Slabs:
  0-1 kg → ₹40
  1-3 kg → ₹70
  3-5 kg → ₹100

Same cart, total weight: 3.4 kg
Falls in "3-5 kg" slab → Delivery fee: ₹100
```

---

## GROCERY ECOMMERCE — SPECIFIC FEATURES

---

### Feature 7: Area-Wise Delivery Fee (Grocery)

**What:** Different delivery fees for different delivery areas/zones configured by the admin.

**Admin Panel:**
- Location: Existing Delivery Area settings (already in the system)
- Changes needed:
  - **Create Delivery Area form** → Add `delivery_fee` field (number, currency)
  - **Edit Delivery Area form** → Add `delivery_fee` field (editable, pre-filled)
  - The delivery fee is stored as part of the delivery area record

**Database Change:**
- Add `delivery_fee` column/field to the existing delivery areas table/collection

**Storefront Logic:**
- At checkout, detect or let the user select their delivery area
- Fetch the delivery fee associated with that area
- Apply it to the order
- Display in order summary: "Delivery to {area_name}: ₹{area_fee}"

**Example:**
```
Delivery Areas:
  Area: "Downtown"      → ₹20
  Area: "Suburbs North" → ₹40
  Area: "Suburbs South" → ₹50
  Area: "Outskirts"     → ₹80

Customer selects "Suburbs North" → Delivery fee: ₹40
```

---

### Feature 8: Distance-Based Delivery Fee (Grocery)

**What:** Delivery fee calculated based on actual distance from the store to the customer's delivery address. Admin can choose between TWO calculation types:

#### Calculation Type Options (Admin chooses ONE):

**Type A — Slab-Based:**
Admin defines distance range slabs, each with a fixed fee. The calculated distance falls into one slab and that slab's fee is charged.

```
Example Slabs:
  0 km  — 2 km   → ₹20
  2 km  — 5 km   → ₹40
  5 km  — 10 km  → ₹70
  10 km — above   → Not Serviceable

Customer is 3.5 km away → Falls in "2-5 km" slab → Delivery fee: ₹40
```

**Type B — Per KM (Fixed Rate):**
Admin sets a single rate per kilometer. The calculated distance is multiplied by this rate.

```
Example:
  Rate: ₹15 per km

  Customer is 3.5 km away → 3.5 × ₹15 = ₹52.50 → rounded to ₹53 delivery fee
  Customer is 8 km away → 8 × ₹15 = ₹120 delivery fee
```

**Admin Panel:**
- Location: Delivery Settings page (Grocery)
- Fields:
  - `distance_based_delivery_enabled` — Toggle ON/OFF
  - `distance_calculation_type` — Dropdown/Radio: "Slab-Based" or "Per KM Rate"
  - `store_location` — Store address with latitude/longitude (can use a map picker or manual lat/lng input)
  - `max_delivery_distance` — Maximum serviceable distance in km (orders beyond this are blocked with "Not Serviceable" message). This applies to BOTH slab-based and per-km modes.
  - **If Slab-Based selected:**
    - Distance slabs (dynamic table, admin can add/remove rows):
      - Each row: `min_distance_km`, `max_distance_km`, `delivery_fee` (₹), `serviceable` (Yes/No toggle)
      - "Add Slab" button to add more rows
      - Delete icon to remove a slab
      - Admin can add unlimited slabs
      - Option to mark any slab as "Not Serviceable" instead of providing a fee
  - **If Per KM Rate selected:**
    - `per_km_rate` — Single number input (₹ per km, e.g., ₹15)
    - `rounding_rule` — Dropdown: "Round up to nearest rupee" / "Round to nearest rupee" / "No rounding"

**Distance Calculation:**
- Use Google Maps Distance Matrix API or similar for accurate driving distance
- Alternatively, Haversine formula for straight-line distance (less accurate but no API cost)
- Recommended: Google Maps API for accuracy
- Store the calculated distance with the order for reference

**Storefront Logic:**
- Get customer's delivery address (with coordinates from address input or map selection)
- Calculate distance between store location and customer address
- Check if distance is within max_delivery_distance — if not, show "Sorry, we don't deliver to your location yet." and block order
- If within range:
  - Type A (Slab): Find the slab → charge that slab's fee. If slab is marked "Not Serviceable" → block order
  - Type B (Per KM): Multiply distance × per_km_rate → apply rounding rule → that's the fee
- Display on checkout: "Delivery ({distance} km): ₹{fee}"

**Example (Per KM):**
```
Per KM rate: ₹15/km
Max delivery distance: 12 km

Customer A: 3.5 km away → 3.5 × ₹15 = ₹52.50 → ₹53 (rounded up)
Customer B: 8 km away → 8 × ₹15 = ₹120
Customer C: 15 km away → Blocked: "Not serviceable"
```

**Example (Slab-Based):**
```
Slabs:
  0-2 km   → ₹20  (Serviceable ✅)
  2-5 km   → ₹40  (Serviceable ✅)
  5-10 km  → ₹70  (Serviceable ✅)
  10+ km   → Not Serviceable ❌

Customer A: 3.5 km away → Falls in "2-5 km" → ₹40
Customer B: 12 km away → Falls in "10+ km" → Blocked: "Not serviceable"
```

---

## DELIVERY FEE PRIORITY & CALCULATION RULES

This defines which delivery fee method takes precedence when multiple are enabled.

### D2C Ecommerce — Fee Calculation Flow:

**Step 1: Minimum Order Check**
- If minimum order is enabled and cart total is below the minimum → BLOCK checkout, show error. Stop here.

**Step 2: Free Delivery Check**
- If free delivery is enabled and cart total meets or exceeds the threshold → Delivery fee = ₹0. Done.

**Step 3: Calculate Delivery Fee (pick ONE method based on what's enabled)**
- **If Weight-Based delivery is enabled** → Use weight-based calculation (slab or per-kg depending on admin's choice). This OVERRIDES fixed and product-wise fees entirely.
- **If Weight-Based is NOT enabled** → Use Product-wise + Fixed fee combo:
  - For each unique product in cart: if it has a product-wise fee → add that fee (once per product, not per quantity)
  - If any product in the cart does NOT have a product-wise fee → add the fixed delivery fee once (as a catch-all for those products)
  - Total = sum of all product-wise fees + fixed fee (if applicable)

**Step 4: Apply Max Fee Cap**
- If max delivery fee cap is enabled and the calculated fee exceeds the cap → reduce to the cap amount

**Step 5: Final delivery fee is ready**

**Priority summary (highest to lowest):**
1. Free delivery threshold (overrides everything)
2. Weight-based (overrides fixed + product-wise)
3. Product-wise fees (overrides fixed for specific products)
4. Fixed fee (fallback)
5. Max fee cap (applied on top of any method)

---

### Grocery Ecommerce — Fee Calculation Flow:

**Step 1: Minimum Order Check**
- If minimum order is enabled and cart total is below the minimum → BLOCK checkout, show error. Stop here.

**Step 2: Free Delivery Check**
- If free delivery is enabled and cart total meets or exceeds the threshold → Delivery fee = ₹0. Done.

**Step 3: Calculate Delivery Fee (pick ONE method based on what's enabled)**
- **If Distance-Based delivery is enabled** and customer location is available → Use distance-based calculation (slab or per-km). If customer is outside serviceable range → BLOCK order with "Not serviceable" message.
- **If Distance-Based is NOT enabled (or customer location unavailable)** → Use Area-wise fee: fetch the delivery fee from the customer's selected delivery area.
- **If neither distance-based nor area-wise fee is available** → Fall back to fixed delivery fee.
- **If nothing is enabled** → Delivery fee = ₹0.

**Step 4: Apply Max Fee Cap**
- If max delivery fee cap is enabled and the calculated fee exceeds the cap → reduce to the cap amount

**Step 5: Final delivery fee is ready**

**Priority summary (highest to lowest):**
1. Free delivery threshold (overrides everything)
2. Distance-based (overrides area-wise + fixed)
3. Area-wise (overrides fixed)
4. Fixed fee (fallback)
5. Max fee cap (applied on top of any method)

---

## DATABASE / MODEL CHANGES

### Delivery Settings — D2C

```
delivery_settings_d2c {
  // Fixed Delivery
  fixed_delivery_fee_enabled: Boolean (default: false)
  fixed_delivery_fee: Number (default: 0)

  // Free Delivery Threshold
  free_delivery_enabled: Boolean (default: false)
  free_delivery_threshold: Number (default: 0)

  // Minimum Order Value
  minimum_order_enabled: Boolean (default: false)
  minimum_order_value: Number (default: 0)

  // Max Delivery Fee Cap
  max_delivery_fee_enabled: Boolean (default: false)
  max_delivery_fee: Number (default: 0)

  // Weight-Based Delivery
  weight_based_delivery_enabled: Boolean (default: false)
  weight_calculation_type: String ("slab" or "per_kg", default: "slab")
  per_kg_rate: Number (default: 0, used only when type is "per_kg")
  weight_slabs: [                          // used only when type is "slab"
    {
      min_weight: Number (kg)
      max_weight: Number (kg or null for last slab)
      delivery_fee: Number
    }
  ]

  updated_at: DateTime
}
```

### Delivery Settings — Grocery

```
delivery_settings_grocery {
  // Fixed Delivery
  fixed_delivery_fee_enabled: Boolean (default: false)
  fixed_delivery_fee: Number (default: 0)

  // Free Delivery Threshold
  free_delivery_enabled: Boolean (default: false)
  free_delivery_threshold: Number (default: 0)

  // Minimum Order Value
  minimum_order_enabled: Boolean (default: false)
  minimum_order_value: Number (default: 0)

  // Max Delivery Fee Cap
  max_delivery_fee_enabled: Boolean (default: false)
  max_delivery_fee: Number (default: 0)

  // Distance-Based Delivery
  distance_based_delivery_enabled: Boolean (default: false)
  distance_calculation_type: String ("slab" or "per_km", default: "slab")
  per_km_rate: Number (default: 0, used only when type is "per_km")
  rounding_rule: String ("round_up" / "round_nearest" / "no_rounding", default: "round_up")
  max_delivery_distance: Number (km, default: null — means no limit)
  store_latitude: Number
  store_longitude: Number
  store_address: String
  distance_slabs: [                        // used only when type is "slab"
    {
      min_distance_km: Number
      max_distance_km: Number (or null for last slab)
      delivery_fee: Number
      not_serviceable: Boolean (default: false)
    }
  ]

  updated_at: DateTime
}
```

### Delivery Area Model — Grocery (Update Existing)

```
delivery_area {
  ...all existing fields remain unchanged...
  delivery_fee: Number (default: 0)        // ← NEW FIELD
}
```

### Product Model — D2C (Update Existing)

```
product {
  ...all existing fields remain unchanged...

  // NEW FIELDS — Shipping & Delivery section
  product_delivery_fee_enabled: Boolean (default: false)
  product_delivery_fee: Number (default: null)
  product_weight: Number (kg, default: null)
  product_length: Number (cm, default: null)
  product_width: Number (cm, default: null)
  product_height: Number (cm, default: null)
}
```

---

## ADMIN PANEL UI CHANGES

### D2C — Delivery Settings Page (Side Panel → "Delivery Settings")

Add a new menu item **"Delivery Settings"** in the admin side panel navigation. This page contains all delivery configurations in organized sections:

```
┌──────────────────────────────────────────────────────┐
│  DELIVERY SETTINGS                                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ── Fixed Delivery Fee ───────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Delivery Fee: [₹ ______]                            │
│                                                      │
│  ── Free Delivery ────────────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Free delivery on orders above: [₹ ______]           │
│                                                      │
│  ── Minimum Order Value ──────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Minimum order amount: [₹ ______]                    │
│                                                      │
│  ── Max Delivery Fee Cap ─────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Maximum delivery fee per order: [₹ ______]          │
│                                                      │
│  ── Weight-Based Delivery ────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  ⚠️ Note: When enabled, this overrides fixed and     │
│  product-wise delivery fees.                         │
│                                                      │
│  Calculation Type: ( ) Slab-Based  ( ) Per KG Rate   │
│                                                      │
│  ┌─── If "Per KG Rate" selected ──────────────────┐  │
│  │  Rate per KG: [₹ ______]                       │  │
│  │  Example: ₹70/kg → 3.4kg cart = ₹238           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── If "Slab-Based" selected ───────────────────┐  │
│  │  Weight Slabs:                                  │  │
│  │  ┌────────┬────────┬──────────┬───────┐         │  │
│  │  │ Min Kg │ Max Kg │ Fee (₹)  │ Action│         │  │
│  │  ├────────┼────────┼──────────┼───────┤         │  │
│  │  │ 0      │ 1      │ 40       │  🗑️  │         │  │
│  │  │ 1      │ 3      │ 70       │  🗑️  │         │  │
│  │  │ 3      │ 5      │ 100      │  🗑️  │         │  │
│  │  │ 5      │ 10     │ 150      │  🗑️  │         │  │
│  │  │ 10     │ above  │ 250      │  🗑️  │         │  │
│  │  └────────┴────────┴──────────┴───────┘         │  │
│  │  [+ Add Slab]                                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│                             [Save Settings]          │
└──────────────────────────────────────────────────────┘
```

**UI Notes:**
- Each section is collapsible or in a card layout
- Toggle OFF should grey out / disable the fields in that section
- For weight-based: show ONLY the relevant sub-section based on the selected calculation type (hide the other)
- Validation: fee values must be positive numbers
- "Save Settings" saves all sections at once
- Show a success toast on save

---

### D2C — Product Add/Edit Page (Update)

Add a new section **"Shipping & Delivery"** on the product add and edit forms:

```
┌─────────────────────────────────────────────────┐
│  SHIPPING & DELIVERY                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ── Product-Wise Delivery Fee ───────────────── │
│  [Toggle: ON/OFF]                               │
│  Delivery Fee: [₹ ______]                       │
│  (Overrides fixed delivery fee for this product)│
│                                                 │
│  ── Weight & Dimensions ─────────────────────── │
│  Weight: [______ kg]                            │
│  Length: [______ cm]  Width: [______ cm]         │
│  Height: [______ cm]                            │
│  (Required if weight-based delivery is enabled) │
│                                                 │
└─────────────────────────────────────────────────┘
```

**UI Notes:**
- This section appears on BOTH product create and product edit pages
- For existing products, fields are empty/null by default — admin can fill them in at any time
- If weight-based delivery is enabled globally and product weight is not set, show a warning: "⚠️ Weight is required for delivery fee calculation"
- Dimensions are optional (for future use / volumetric weight calculation)

---

### Grocery — Delivery Settings Page (Update Existing)

The grocery module already has a delivery settings area. Add these sections to the existing page:

```
┌──────────────────────────────────────────────────────┐
│  DELIVERY SETTINGS (GROCERY)                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ── Fixed Delivery Fee ───────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Delivery Fee: [₹ ______]                            │
│                                                      │
│  ── Free Delivery ────────────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Free delivery on orders above: [₹ ______]           │
│                                                      │
│  ── Minimum Order Value ──────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Minimum order amount: [₹ ______]                    │
│                                                      │
│  ── Max Delivery Fee Cap ─────────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  Maximum delivery fee per order: [₹ ______]          │
│                                                      │
│  ── Distance-Based Delivery ──────────────────────── │
│  [Toggle: ON/OFF]                                    │
│  ⚠️ Note: When enabled, this overrides area-wise     │
│  and fixed delivery fees.                            │
│                                                      │
│  Store Location:                                     │
│  Address: [_______________________________]          │
│  [📍 Pick on Map] or                                 │
│  Latitude: [________] Longitude: [________]          │
│                                                      │
│  Max Delivery Distance: [______ km]                  │
│  (Orders beyond this distance will be blocked)       │
│                                                      │
│  Calculation Type: ( ) Slab-Based  ( ) Per KM Rate   │
│                                                      │
│  ┌─── If "Per KM Rate" selected ──────────────────┐  │
│  │  Rate per KM: [₹ ______]                       │  │
│  │  Rounding: [Round up ▼]                         │  │
│  │  Example: ₹15/km → 3.5km = ₹53 (rounded up)   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── If "Slab-Based" selected ───────────────────┐  │
│  │  Distance Slabs:                                │  │
│  │  ┌─────────┬─────────┬──────────┬────────────┐  │  │
│  │  │ Min Km  │ Max Km  │ Fee (₹)  │ Serviceable│  │  │
│  │  ├─────────┼─────────┼──────────┼────────────┤  │  │
│  │  │ 0       │ 2       │ 20       │ ✅ Yes     │  │  │
│  │  │ 2       │ 5       │ 40       │ ✅ Yes     │  │  │
│  │  │ 5       │ 10      │ 70       │ ✅ Yes     │  │  │
│  │  │ 10      │ above   │ —        │ ❌ No      │  │  │
│  │  └─────────┴─────────┴──────────┴────────────┘  │  │
│  │  [+ Add Slab]                                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│                             [Save Settings]          │
└──────────────────────────────────────────────────────┘
```

---

### Grocery — Delivery Area Create/Edit Form (Update Existing)

Add `delivery_fee` field to the existing delivery area forms:

```
┌─────────────────────────────────────────────────┐
│  CREATE / EDIT DELIVERY AREA                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Area Name: [_______________________________]   │
│  ... (all existing fields remain as-is) ...     │
│                                                 │
│  Delivery Fee: [₹ ______]  ← NEW FIELD         │
│                                                 │
│              [Save]  [Cancel]                   │
└─────────────────────────────────────────────────┘
```

---

## STOREFRONT CHANGES

### D2C Storefront

**Single Product Page:**
- Below the product price, show delivery fee info:
  - If product has product_delivery_fee → "Delivery: ₹{fee}"
  - If only fixed delivery is active → "Delivery: ₹{fixed_fee}"
  - If weight-based is active → "Delivery fee calculated at checkout based on weight"
  - If free delivery threshold is set → "Free delivery on orders above ₹{threshold}"

**Cart Page:**
- Show delivery fee calculation in cart summary
- Show "Add ₹{remaining} more for free delivery!" message if applicable
- Show "Minimum order is ₹{amount}" warning if cart is below minimum
- Disable checkout button if below minimum order value

**Checkout Page:**
- Show full delivery fee breakdown in order summary
- Show subtotal, delivery fee (with brief explanation like "Weight-based" or "Fixed"), and total
- If free delivery → show "Free Delivery ✓" with strikethrough on the original fee amount

### Grocery Storefront

**Cart Page:**
- Show delivery fee based on selected delivery area or calculated distance
- Show free delivery / minimum order messages as applicable

**Checkout Page:**
- Show delivery area name and associated fee
- OR show distance-based fee with distance displayed
- Show "Not serviceable" error if customer is outside delivery range

---

## API ENDPOINTS NEEDED

### D2C APIs

```
GET    /api/d2c/delivery-settings          → Get all delivery settings
PUT    /api/d2c/delivery-settings          → Update delivery settings (all fields)

GET    /api/d2c/products/:id               → Product details (now includes shipping fields)
POST   /api/d2c/products                   → Create product (now accepts shipping fields)
PUT    /api/d2c/products/:id               → Update product (now accepts shipping fields)

POST   /api/d2c/calculate-delivery-fee     → Calculate delivery fee for a cart
  Request: cart items with product IDs and quantities
  Response: delivery fee amount, breakdown, free delivery status, any messages/warnings
```

### Grocery APIs

```
GET    /api/grocery/delivery-settings       → Get all delivery settings
PUT    /api/grocery/delivery-settings       → Update delivery settings

GET    /api/grocery/delivery-areas          → List delivery areas (now includes delivery_fee)
POST   /api/grocery/delivery-areas          → Create delivery area (now accepts delivery_fee)
PUT    /api/grocery/delivery-areas/:id      → Update delivery area (now accepts delivery_fee)

POST   /api/grocery/calculate-delivery-fee  → Calculate delivery fee
  Request: cart items, delivery area ID or customer lat/lng
  Response: delivery fee amount, distance (if applicable), serviceable status, any messages
```

---

## EDGE CASES TO HANDLE

1. **No delivery method enabled:** Delivery fee = ₹0 (free by default)
2. **Weight-based enabled but product has no weight:** Treat product weight as 0kg. Show warning in admin panel on that product.
3. **Product-wise fee + Weight-based both configured:** Weight-based takes priority. Show a note in admin UI explaining this.
4. **Distance-based + Area-wise both configured (Grocery):** Distance-based takes priority. Area-wise is fallback if distance can't be calculated.
5. **Free delivery threshold = 0:** Means all orders get free delivery. Show a warning to admin.
6. **Max delivery fee cap is less than some slab/calculated fees:** The cap overrides. This is expected.
7. **Cart is empty:** Don't calculate delivery fee. Return ₹0.
8. **All toggles OFF:** Default to ₹0 delivery fee.
9. **Customer address not precise enough for distance calculation:** Fall back to area-wise fee → then fixed fee → then ₹0.
10. **Per KG rate with 0 weight cart:** Delivery fee = ₹0. Show message that product weights are missing.
11. **Per KM rate with very short distance (e.g., 0.2 km):** Calculate normally (0.2 × rate). The rounding rule handles small amounts.
12. **Admin sets both per-kg and slab (shouldn't happen):** The calculation type radio/dropdown ensures only one is active at a time. Validate this on save.

---

## IMPLEMENTATION PRIORITY ORDER

### Phase 1 (Must-have, build first):
1. Fixed Delivery Fee (both D2C & Grocery)
2. Minimum Order Value (both)
3. Free Delivery Threshold (both)
4. Area-Wise Delivery Fee (Grocery — update existing delivery area forms)
5. Product-Wise Delivery Fee (D2C — update product forms)
6. Product weight & dimensions fields on product add/edit (D2C)
7. Delivery Settings page — D2C (new page in side panel)
8. Delivery Settings page — Grocery (update existing page)
9. Storefront delivery fee display (product page, cart, checkout — both modules)

### Phase 2 (Important, build next):
10. Max Delivery Fee Cap (both)
11. Weight-Based Delivery Fee — Slab mode (D2C)
12. Weight-Based Delivery Fee — Per KG mode (D2C)
13. Weight slab management UI (add/remove slabs)

### Phase 3 (Build after Phase 1 & 2 are stable):
14. Distance-Based Delivery Fee — Slab mode (Grocery)
15. Distance-Based Delivery Fee — Per KM mode (Grocery)
16. Store location picker (map integration)
17. Distance slab management UI
18. Distance calculation integration (Google Maps API or similar)
19. Max delivery distance & "Not Serviceable" handling on storefront
20. Rounding rule for per-km calculation

---

## TESTING CHECKLIST

- [ ] Fixed delivery fee applies correctly to orders
- [ ] Product-wise fee overrides fixed fee for specific products
- [ ] Product-wise fee charges once per product, NOT per quantity
- [ ] Weight-based slab fee calculates correctly from cart weight
- [ ] Weight-based per-kg fee calculates correctly (weight × rate)
- [ ] Weight-based priority: overrides fixed + product-wise when enabled
- [ ] Only one weight calculation type is active at a time (slab OR per-kg)
- [ ] Area-wise fee applies based on selected delivery area (Grocery)
- [ ] Distance-based slab fee calculates correctly from coordinates (Grocery)
- [ ] Distance-based per-km fee calculates correctly (distance × rate) with rounding
- [ ] Only one distance calculation type is active at a time (slab OR per-km)
- [ ] Max delivery distance blocks orders beyond the limit
- [ ] "Not Serviceable" blocks order for out-of-range customers
- [ ] Free delivery threshold waives ALL delivery fees
- [ ] Minimum order value blocks checkout when not met
- [ ] Max delivery fee cap works when fees exceed the cap
- [ ] All toggles OFF → ₹0 delivery fee
- [ ] Product add page shows new shipping & delivery fields
- [ ] Product edit page shows and pre-fills shipping & delivery fields
- [ ] Existing products can be updated with weight/dimensions/delivery fee
- [ ] Storefront product page shows correct delivery info
- [ ] Cart page shows correct delivery breakdown and messages
- [ ] Checkout page shows correct final delivery amount
- [ ] Admin settings save and load correctly
- [ ] Slab add/delete works for weight and distance
- [ ] Calculation type switch (slab ↔ per-kg / slab ↔ per-km) works correctly
- [ ] Edge cases handled (no weight, no area, empty cart, etc.)
