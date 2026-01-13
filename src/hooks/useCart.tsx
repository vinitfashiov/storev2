/**
 * Enterprise Optimized Cart Hook
 * With instant optimistic updates for smooth UX
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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
  } | null;
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

  const getCartKey = () => `${CART_STORAGE_KEY}_${storeSlug}`;

  const fetchCart = useCallback(async (cartId: string) => {
    try {
      const { data: cartData, error: cartError } = await supabase
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

      const { data: items } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(id, name, slug, price, images, stock_qty)
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
      const { data, error } = await supabase
        .from('carts')
        .insert({
          tenant_id: tenantId,
          store_slug: storeSlug,
          status: 'active'
        })
        .select()
        .single();

      if (error || !data) return null;

      localStorage.setItem(getCartKey(), data.id);
      const newCart: Cart = { ...data, items: [] };
      setCart(newCart);
      return newCart;
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }, [tenantId, storeSlug]);

  const addToCart = useCallback(async (productId: string, price: number, qty: number = 1) => {
    if (!tenantId) return false;

    try {
      let currentCart = cart;
      if (!currentCart) {
        currentCart = await createCart();
        if (!currentCart) return false;
      }

      const existingItem = currentCart.items.find(item => item.product_id === productId);
      
      // INSTANT optimistic update
      const newQty = existingItem ? existingItem.qty + qty : qty;
      setCart(prev => {
        if (!prev) return prev;
        const updatedItems = existingItem
          ? prev.items.map(item => 
              item.product_id === productId 
                ? { ...item, qty: newQty }
                : item
            )
          : [...prev.items, { 
              id: `temp-${Date.now()}`, 
              product_id: productId, 
              qty, 
              unit_price: price,
              product: null 
            }];
        return { ...prev, items: updatedItems };
      });
      setItemCount(prev => prev + qty);
      
      // Background DB update
      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ qty: newQty })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            tenant_id: tenantId,
            cart_id: currentCart.id,
            product_id: productId,
            qty,
            unit_price: price
          });
      }

      // Sync with DB in background
      fetchCart(currentCart.id);
      return true;
    } catch (error) {
      console.error('Error in addToCart:', error);
      return false;
    }
  }, [cart, tenantId, createCart, fetchCart]);

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
          await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId);
        } else {
          await supabase
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
      await supabase
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
