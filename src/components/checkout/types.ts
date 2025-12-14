// Checkout Types and Interfaces

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface CheckoutFormState {
    email: string;
    phone: string;
    shippingAddress: ShippingAddress;
}

export interface ProductSelection {
    productId: string;
    variantId: string;
    selectedColor: string;
    selectedSize: string;
    purchaseType: string;
    quantity: number;
}

export interface ValidationErrors {
    [key: string]: string;
}

export interface ProductPricingResult {
    price: number;
    productName: string;
    savings: string;
    isBundle: boolean;
    isDirectPurchase: boolean;
}
