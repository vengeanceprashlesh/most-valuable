// Checkout Validation Functions

import { ShippingAddress, ValidationErrors } from './types';

/**
 * Validates email format
 */
export const isEmailValid = (emailValue: string): boolean => {
    const trimmed = emailValue.trim();
    if (!trimmed) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
};

/**
 * Validates shipping address and returns errors object
 */
export const validateShippingAddress = (
    shippingAddress: ShippingAddress,
    phone?: string
): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!shippingAddress.firstName.trim()) {
        errors.firstName = 'First name is required';
    }
    if (!shippingAddress.lastName.trim()) {
        errors.lastName = 'Last name is required';
    }
    if (!shippingAddress.address1.trim()) {
        errors.address1 = 'Address is required';
    }
    if (!shippingAddress.city.trim()) {
        errors.city = 'City is required';
    }
    if (!shippingAddress.state.trim()) {
        errors.state = 'State is required';
    }
    if (!shippingAddress.postalCode.trim()) {
        errors.postalCode = 'Postal code is required';
    }

    // Phone number validation (mandatory for both contact and delivery)
    const currentPhone = phone || shippingAddress.phone || '';
    if (!currentPhone.trim()) {
        errors.phone = 'Phone number is required';
    }

    return errors;
};

/**
 * Checks if the entire form is valid for submission
 */
export const isFormComplete = (
    email: string,
    phone: string | undefined,
    shippingAddress: ShippingAddress
): boolean => {
    const trimmedEmail = email.trim();
    const emailValid = trimmedEmail.length > 0 && isEmailValid(trimmedEmail);
    const phoneValid = (phone || shippingAddress.phone || '').trim().length > 0;
    const addressValid =
        shippingAddress.firstName.trim() &&
        shippingAddress.lastName.trim() &&
        shippingAddress.address1.trim() &&
        shippingAddress.city.trim() &&
        shippingAddress.state.trim() &&
        shippingAddress.postalCode.trim();

    return emailValid && phoneValid && !!addressValid;
};
