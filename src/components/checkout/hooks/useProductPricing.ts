"use client";

import { useMemo } from 'react';
import { PRODUCT_PRICING, DIRECT_PURCHASE_PRODUCT_IDS } from '../constants';
import { ProductPricingResult } from '../types';

interface UseProductPricingProps {
    productId: string;
    purchaseType: string;
    quantity: number;
}

/**
 * Hook to calculate product pricing based on product selection
 */
export function useProductPricing({
    productId,
    purchaseType,
    quantity,
}: UseProductPricingProps): ProductPricingResult {
    return useMemo(() => {
        // Determine if this is a direct purchase
        const isDirectPurchase =
            purchaseType === "direct" ||
            DIRECT_PURCHASE_PRODUCT_IDS.includes(productId);

        // Calculate bundle for raffle entries
        const isBundle = !isDirectPurchase && quantity === 4;

        let price: number;
        let productName: string;
        let savings = "";

        if (isDirectPurchase) {
            // Direct purchase pricing from config
            const productConfig = PRODUCT_PRICING[productId];
            if (productConfig) {
                price = productConfig.price;
                productName = productConfig.name;
            } else {
                price = 1700; // Default direct purchase price
                productName = "Direct Purchase";
            }
        } else {
            // Raffle entry pricing
            price = isBundle ? 100 : quantity * 50;
            savings = isBundle ? "Save $100!" : "";
            productName = "Gold Rush Raffle Entries";
        }

        return {
            price,
            productName,
            savings,
            isBundle,
            isDirectPurchase,
        };
    }, [productId, purchaseType, quantity]);
}
