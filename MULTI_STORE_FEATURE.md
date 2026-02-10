# Multi-Store Feat ure Documentation

## 🎯 Overview

This feature enables **one email to manage multiple stores**, with each store having completely **independent payment and delivery systems**. Users can easily switch between stores and delete stores with proper confirmation.

## ✨ Features

### 1. Multiple Stores Per User
- One email can create and manage multiple stores
- Each store is completely independent
- Separate payment configurations (Razorpay keys)
- Separate delivery configurations (Shiprocket credentials)
- Independent inventory, orders, customers, etc.

### 2. Store Switcher
- Quick store switching from header
- Shows all user's stores
- Displays store type (E-commerce/Grocery) and plan (Trial/Pro)
- Highlights current/primary store
- Quick access to create new store

### 3. Store Management Page
- View all stores in one place
- See store details (name, type, plan, status)
- Switch between stores
- Delete stores with confirmation

### 4. Delete Store Feature
- **Confirmation Modal** with:
  - Warning about permanent deletion
  - List of what will be deleted
  - **Type-to-confirm** (must type store name exactly)
  - Clear visual warnings
- Soft delete (marks as deleted, doesn't remove data immediately)
- Removes user association
- Auto-switches to another store if deleted store was primary

## 📁 Files Created/Modified

### Database Migration
- `supabase/migrations/20251225000003_multi_store_support.sql`
  - Creates `user_tenants` junction table (many-to-many)
  - Adds soft delete to tenants
  - Updates RLS policies
  - Creates helper functions

### Components
- `src/components/admin/StoreSwitcher.tsx` - Store switcher dropdown
- `src/pages/admin/AdminStores.tsx` - Store management page
- Updated `src/components/admin/AdminHeader.tsx` - Added store switcher
- Updated `src/components/admin/AdminLayout.tsx` - Pass tenant props
- Updated `src/components/admin/AdminSidebar.tsx` - Added "My Stores" link

### Context & Pages
- Updated `src/contexts/AuthContext.tsx` - Multi-store support
- Updated `src/pages/Dashboard.tsx` - Store switching handler
- Updated `src/pages/Onboarding.tsx` - Create user_tenants entry

## 🗄️ Database Schema

### New Table: `user_tenants`
```sql
CREATE TABLE user_tenants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

### Updated Table: `tenants`
- Added `deleted_at` (soft delete)
- Added `deletion_reason`

## 🔧 Functions

### `get_user_tenants()`
Returns all tenants associated with current user.

### `get_user_primary_tenant_id()`
Returns the primary tenant ID for current user.

### `set_primary_tenant(tenant_id)`
Sets a tenant as primary (for switching stores).

### `user_has_tenant_access(tenant_id)`
Checks if user has access to a tenant.

### `delete_tenant(tenant_id, reason)`
Soft deletes a tenant and removes user association.

## 🚀 Usage

### Creating a New Store
1. Click "Create New Store" from store switcher or stores page
2. Complete onboarding process
3. New store is automatically set as primary
4. User is redirected to new store's dashboard

### Switching Stores
1. Click store switcher in header
2. Select desired store
3. Store is set as primary
4. Page reloads with new store context

### Deleting a Store
1. Go to "My Stores" page (`/dashboard/stores`)
2. Click delete icon on store
3. **Type store name exactly** in confirmation field
4. Click "Delete Store"
5. Store is soft deleted and user association removed

## 🔐 Security

### RLS Policies
- Users can only view/access their associated tenants
- All tenant-scoped data uses `user_has_tenant_access()` check
- Deleted tenants are excluded from queries

### Data Isolation
- Each store's data is completely isolated
- Payment configurations are per-tenant
- Delivery configurations are per-tenant
- No cross-store data access

## 📊 Independent Systems

### Payment System
- Each store has its own Razorpay keys
- Stored in `tenant_integrations` table
- Payment intents are tenant-scoped
- Webhooks are tenant-scoped

### Delivery System
- Each store has its own Shiprocket credentials
- Delivery zones, slots, boys are tenant-scoped
- Shipments are tenant-scoped
- Tracking updates are tenant-scoped

### Inventory System
- Products, stock, movements are tenant-scoped
- Suppliers, purchase orders are tenant-scoped
- Batches (for grocery) are tenant-scoped

## 🎨 UI Components

### Store Switcher
- Dropdown in header
- Shows current store name
- Lists all stores with type and plan
- Quick create new store option
- Link to manage stores

### Store Management Page
- Table view of all stores
- Shows: Name, Type, Plan, Status, Created date
- Actions: Switch, View Storefront, Delete
- Primary store badge

### Delete Confirmation Modal
- Warning icon and message
- List of what will be deleted
- Type-to-confirm input
- Disabled until name matches exactly
- Destructive styling

## 🔄 Migration Steps

1. **Run Migration**
   ```bash
   supabase migration up
   ```

2. **Existing Data**
   - Migration automatically creates `user_tenants` entries from existing `profiles.tenant_id`
   - First tenant becomes primary
   - No data loss

3. **Test**
   - Create a new store
   - Switch between stores
   - Verify data isolation
   - Test delete functionality

## ⚠️ Important Notes

1. **Soft Delete**: Stores are soft deleted (marked with `deleted_at`), not permanently removed
2. **Primary Store**: When deleting primary store, system auto-selects another as primary
3. **Data Isolation**: Each store's data is completely independent
4. **Backward Compatibility**: Old `profile.tenant_id` is kept for compatibility but new system uses `user_tenants`

## 🐛 Troubleshooting

### Store Not Showing
- Check if user has `user_tenants` entry
- Verify tenant is not deleted (`deleted_at IS NULL`)
- Check RLS policies

### Can't Switch Store
- Verify user has access to target tenant
- Check if target tenant is deleted
- Verify `set_primary_tenant` function permissions

### Delete Not Working
- Ensure store name matches exactly (case-sensitive)
- Check if user is owner of store
- Verify RLS policies allow deletion

## 📝 Future Enhancements

- Store templates/cloning
- Store analytics comparison
- Bulk operations across stores
- Store sharing/collaboration
- Store export/import

