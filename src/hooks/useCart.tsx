/**
 * Enterprise Optimized Cart Hook
 * With instant optimistic updates for smooth UX
 * Now includes analytics event tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Json } from '@/integrations/supabase/types';
import { useStoreAnalyticsEvent } from '@/contexts/StoreAnalyticsContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Json;
    stock_qty: number;
    product_delivery_fee_enabled?: boolean;
    product_delivery_fee?: number | null;
  } | null;
  variant_id?: string | null;
  variant?: {
    id: string;
    sku: string | null;
    price: number;
    stock_qty: number;
    variant_attributes?: {
      attribute: { name: string };
      attribute_value: { value: string };
    }[];
  };
}

interface Cart {
  id: string;
  tenant_id: string;
  store_slug: string;
  status: string;
  items: CartItem[];
}

const CART_STORAGE_KEY = 'store_cart_id';

export function useCart(storeSlug: string, tenantId: string | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  const operationQueue = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { trackEvent } = useStoreAnalyticsEvent();

  const getCartKey = () => `${CART_STORAGE_KEY}_${storeSlug}`;

  const fetchCart = useCallback(async (cartId: string) => {
    try {
      const { data: cartData, error: cartError } = await supabaseStore
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .eq('status', 'active')
        .maybeSingle();

      if (cartError || !cartData) {
        localStorage.removeItem(getCartKey());
        setCart(null);
        setItemCount(0);
        setLoading(false);
        return null;
      }

      const { data: items } = await supabaseStore
        .from('cart_items')
        .select(`
          *,
          product:products(id, name, slug, price, images, stock_qty, product_delivery_fee_enabled, product_delivery_fee),
          variant:product_variants(id, sku, price, stock_qty, variant_attributes(attribute:attributes(name), attribute_value:attribute_values(value)))
        `)
        .eq('cart_id', cartId);

      const cartWithItems: Cart = {
        ...cartData,
        items: items || []
      };

      setCart(cartWithItems);
      setItemCount(items?.reduce((sum, item) => sum + item.qty, 0) || 0);
      setLoading(false);
      return cartWithItems;
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoading(false);
      return null;
    }
  }, [storeSlug]);

  const createCart = useCallback(async () => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabaseStore
        .from('carts')
        .insert({
          tenant_id: tenantId,
          store_slug: storeSlug,
          status: 'active'
        })
        .select()
        .single();

      if (error || !data) {
        toast.error(`Cart creation error: ${error?.message || 'Unknown'}`);
        return null;
      }

      localStorage.setItem(getCartKey(), data.id);
      const newCart: Cart = { ...data, items: [] };
      setCart(newCart);
      return newCart;
    } catch (error: any) {
      toast.error(`Cart catch error: ${error?.message || 'Unknown'}`);
      console.error('Error creating cart:', error);
      return null;
    }
  }, [tenantId, storeSlug]);

  const addToCart = useCallback(async (productId: string, price: number, qty: number = 1, variantId?: string) => {
    if (!tenantId) {
      toast.error('Missing Tenant ID in cart hook');
      return false;
    }

    try {
      let currentCart = cart;
      if (!currentCart) {
        currentCart = await createCart();
        if (!currentCart) {
          toast.error('Failed to create cart backend instance');
          return false;
        }
      }

      const existingItem = currentCart.items.find(item => item.product_id === productId && (variantId ? item.variant_id === variantId : true));

      // INSTANT optimistic update with proper temp ID handling
      const newQty = existingItem ? existingItem.qty + qty : qty;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      setCart(prev => {
        if (!prev) return prev;
        const updatedItems = existingItem
          ? prev.items.map(item =>
            item.product_id === productId
              ? { ...item, qty: newQty }
              : item
          )
          : [...prev.items, {
            id: tempId,
            product_id: productId,
            variant_id: variantId,
            qty,
            unit_price: price,
            product: null,
            variant: undefined
          }];
        return { ...prev, items: updatedItems };
      });
      setItemCount(prev => prev + qty);

      // Background DB update with error handling
      try {
        if (existingItem) {
          const { error } = await supabaseStore
            .from('cart_items')
            .update({ qty: newQty })
            .eq('id', existingItem.id);

          if (error) throw error;
        } else {
          const { data, error } = await supabaseStore
            .from('cart_items')
            .insert({
              tenant_id: tenantId,
              cart_id: currentCart.id,
              product_id: productId,
              variant_id: variantId,
              qty,
              unit_price: price
            })
            .select('id')
            .single();

          if (error) throw error;

          // Replace temp ID with real ID
          if (data) {
            setCart(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                items: prev.items.map(item =>
                  item.id === tempId ? { ...item, id: data.id } : item
                )
              };
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to sync cart:', error);
        toast.error(`Sync error: ${error?.message || 'Unknown'}`);
        // Rollback optimistic update on error
        fetchCart(currentCart.id);
      }

      // Sync with DB in background
      fetchCart(currentCart.id);

      // Fire analytics event
      trackEvent('add_to_cart', { product_id: productId, qty, price, cart_value: getSubtotal() + price * qty });

      return true;
    } catch (error: any) {
      console.error('Error in addToCart:', error);
      toast.error(`Global add error: ${error?.message || 'Unknown'}`);
      return false;
    }
  }, [cart, tenantId, createCart, fetchCart, trackEvent]);

  // INSTANT optimistic quantity update with debounced DB sync
  const updateQuantity = useCallback(async (itemId: string, qty: number) => {
    if (!cart) return false;

    // Cancel any pending operation for this item
    const existingTimeout = operationQueue.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const currentItem = cart.items.find(item => item.id === itemId);
    if (!currentItem) return false;

    // INSTANT optimistic update - no delay
    if (qty <= 0) {
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        };
      });
      setItemCount(prev => Math.max(0, prev - currentItem.qty));
    } else {
      const qtyDiff = qty - currentItem.qty;
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, qty } : item
          )
        };
      });
      setItemCount(prev => Math.max(0, prev + qtyDiff));
    }

    // Debounced DB update (150ms) for performance
    const timeoutId = setTimeout(async () => {
      try {
        if (qty <= 0) {
          await supabaseStore
            .from('cart_items')
            .delete()
            .eq('id', itemId);
        } else {
          await supabaseStore
            .from('cart_items')
            .update({ qty })
            .eq('id', itemId);
        }
        operationQueue.current.delete(itemId);
      } catch (error) {
        console.error('Error syncing quantity:', error);
        // Rollback on error
        fetchCart(cart.id);
      }
    }, 150);

    operationQueue.current.set(itemId, timeoutId);
    return true;
  }, [cart, fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    return updateQuantity(itemId, 0);
  }, [updateQuantity]);

  const clearCart = useCallback(async () => {
    if (!cart) return;

    try {
      await supabaseStore
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      localStorage.removeItem(getCartKey());
      setCart(null);
      setItemCount(0);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [cart, storeSlug]);

  const getSubtotal = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
  }, [cart]);

  useEffect(() => {
    const savedCartId = localStorage.getItem(getCartKey());
    if (savedCartId && tenantId) {
      fetchCart(savedCartId);
    } else {
      setLoading(false);
    }
  }, [storeSlug, tenantId, fetchCart]);

  // Cleanup pending operations on unmount
  useEffect(() => {
    return () => {
      operationQueue.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    cart,
    loading,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    refreshCart: () => cart?.id ? fetchCart(cart.id) : Promise.resolve(null)
  };
}
