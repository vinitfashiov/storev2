export interface D2CDeliverySettings {
    fixed_delivery_fee_enabled: boolean;
    fixed_delivery_fee: number;
    free_delivery_enabled: boolean;
    free_delivery_threshold: number;
    minimum_order_enabled: boolean;
    minimum_order_value: number;
    max_delivery_fee_enabled: boolean;
    max_delivery_fee: number;
    weight_based_delivery_enabled: boolean;
    weight_calculation_type: 'slab' | 'per_kg';
    per_kg_rate: number;
    weight_slabs: { minWeight: number; maxWeight: number; fee: number }[];
}

export interface GroceryDeliverySettings {
    fixed_delivery_fee_enabled: boolean;
    delivery_fee: number; // mapped to fixed fee
    free_delivery_enabled: boolean;
    free_delivery_above: number | null;
    minimum_order_enabled: boolean;
    min_order_amount: number;
    max_delivery_fee_enabled: boolean;
    max_delivery_fee: number;
    distance_based_delivery_enabled: boolean;
    distance_calculation_type?: 'slab' | 'per_km';
    per_km_rate?: number;
    distance_slabs?: { minDistance: number; maxDistance: number; fee: number }[];
    store_latitude?: number | null;
    store_longitude?: number | null;
    max_delivery_distance?: number | null;
}

export interface CartItem {
    product_id: string;
    qty: number;
    unit_price: number;
    product?: {
        product_delivery_fee_enabled?: boolean;
        product_delivery_fee?: number | null;
        product_weight?: number | null;
    } | null;
}

export function calculateD2CDeliveryFee(
    subtotal: number,
    cartItems: CartItem[],
    settings: D2CDeliverySettings | null
): number {
    if (!settings) return 0;

    // 1. Minimum Order Value Check (Return error condition visually in UI, here we just return fee if valid)
    // If subtotal < min_order_value and minimum_order_enabled is true, checkout must be blocked

    // 2. Free Delivery Check (highest priority override)
    if (settings.free_delivery_enabled && subtotal >= settings.free_delivery_threshold) {
        return 0;
    }

    let totalFee = 0;

    // Check if there are any items that do NOT have a product specific fee
    const itemsUsingBaseFee = cartItems.filter(item =>
        !(item.product?.product_delivery_fee_enabled && item.product?.product_delivery_fee != null)
    );

    // 3. Weight-Based or Fixed Fee
    if (itemsUsingBaseFee.length > 0) {
        if (settings.weight_based_delivery_enabled) {
            // Phase 2 implementation, default to fixed for now if weight logic not fully fleshed out
            // Total up weights ONLY for items using base fee
            let totalWeight = 0;
            itemsUsingBaseFee.forEach(item => {
                const w = item.product?.product_weight || 0;
                totalWeight += (w * item.qty);
            });

            if (settings.weight_calculation_type === 'per_kg') {
                totalFee += totalWeight * settings.per_kg_rate;
            } else {
                // Slab
                const matchingSlab = settings.weight_slabs?.find(
                    slab => totalWeight >= slab.minWeight && totalWeight <= slab.maxWeight
                );
                if (matchingSlab) {
                    totalFee += matchingSlab.fee;
                }
            }
        } else if (settings.fixed_delivery_fee_enabled) {
            totalFee += settings.fixed_delivery_fee;
        }
    }

    // 4. Product-wise specific overrides
    cartItems.forEach(item => {
        if (item.product?.product_delivery_fee_enabled && item.product?.product_delivery_fee != null) {
            // Product specific fee overrides the general weight/fixed for THIS item's portion
            totalFee += (item.product.product_delivery_fee * item.qty);
        }
    });

    // 5. Max Cap
    if (settings.max_delivery_fee_enabled && settings.max_delivery_fee > 0) {
        if (totalFee > settings.max_delivery_fee) {
            totalFee = settings.max_delivery_fee;
        }
    }

    return totalFee;
}

export function calculateGroceryDeliveryFee(
    subtotal: number,
    settings: GroceryDeliverySettings | null,
    areaFee: number = 0,
    distanceInKm: number = 0
): number {
    if (!settings) return 0;

    // 1. Free Delivery Check
    if (settings.free_delivery_enabled && settings.free_delivery_above && subtotal >= settings.free_delivery_above) {
        return 0;
    }

    let totalFee = 0;

    // 2. Distance-Based (Phase 3)
    if (settings.distance_based_delivery_enabled) {
        if (settings.distance_calculation_type === 'per_km') {
            totalFee += distanceInKm * (settings.per_km_rate || 0);
        } else if (settings.distance_slabs) {
            const slab = settings.distance_slabs.find(s => distanceInKm >= s.minDistance && distanceInKm <= s.maxDistance);
            if (slab) totalFee += slab.fee;
        }
    } else if (areaFee > 0) {
        // 3. Area-wise fee
        totalFee += areaFee;
    } else if (settings.fixed_delivery_fee_enabled) {
        // 4. Fixed fee
        totalFee += settings.delivery_fee;
    }

    // 5. Max Cap
    if (settings.max_delivery_fee_enabled && settings.max_delivery_fee > 0) {
        if (totalFee > settings.max_delivery_fee) {
            totalFee = settings.max_delivery_fee;
        }
    }

    return totalFee;
}
