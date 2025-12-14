"use client";

import { useState, useCallback } from 'react';
import { ShippingAddress, ValidationErrors } from '../types';
import { DEFAULT_SHIPPING_ADDRESS } from '../constants';
import { isEmailValid, validateShippingAddress, isFormComplete } from '../validation';

interface UseCheckoutFormReturn {
    // State
    email: string;
    phone: string | undefined;
    shippingAddress: ShippingAddress;
    isLoading: boolean;
    error: string;
    emailError: string;
    addressErrors: ValidationErrors;

    // Handlers
    handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleContactPhoneChange: (value: string) => void;
    handleAddressChange: (field: keyof ShippingAddress, value: string) => void;

    // Validation
    isFormValid: () => boolean;
    validateAndSubmit: (submitFn: () => Promise<void>) => Promise<void>;

    // Setters
    setError: (error: string) => void;
    setIsLoading: (loading: boolean) => void;
}

/**
 * Custom hook for managing checkout form state and validation
 */
export function useCheckoutForm(): UseCheckoutFormReturn {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState<string>();
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(DEFAULT_SHIPPING_ADDRESS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [addressErrors, setAddressErrors] = useState<ValidationErrors>({});

    // Email validation with state updates
    const validateEmailWithState = useCallback((emailValue: string): boolean => {
        const trimmed = emailValue.trim();
        if (!trimmed) {
            setEmailError("");
            return false;
        }

        if (!isEmailValid(trimmed)) {
            setEmailError("Please enter a valid email address");
            return false;
        }

        setEmailError("");
        return true;
    }, []);

    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setError(""); // Clear general error when user starts typing

        if (value.length > 0) {
            validateEmailWithState(value);
        } else {
            setEmailError("");
        }
    }, [validateEmailWithState]);

    const handleAddressChange = useCallback((field: keyof ShippingAddress, value: string) => {
        setShippingAddress(prev => ({ ...prev, [field]: value }));

        // Sync phone numbers between contact and shipping forms
        if (field === 'phone') {
            setPhone(value);
            if (addressErrors.phone) {
                setAddressErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
        }

        // Clear specific field error when user starts typing
        if (addressErrors[field]) {
            setAddressErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [addressErrors]);

    const handleContactPhoneChange = useCallback((value: string) => {
        setPhone(value);
        setShippingAddress(prev => ({ ...prev, phone: value }));
        setError("");

        if (addressErrors.phone) {
            setAddressErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.phone;
                return newErrors;
            });
        }
    }, [addressErrors]);

    const validateAddress = useCallback((): boolean => {
        const errors = validateShippingAddress(shippingAddress, phone);
        setAddressErrors(errors);
        return Object.keys(errors).length === 0;
    }, [shippingAddress, phone]);

    const isFormValidFn = useCallback((): boolean => {
        return isFormComplete(email, phone, shippingAddress) && !isLoading;
    }, [email, phone, shippingAddress, isLoading]);

    const validateAndSubmit = useCallback(async (submitFn: () => Promise<void>) => {
        // Clear previous errors
        setError("");
        setEmailError("");

        // Validate email
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setEmailError("Email address is required");
            document.getElementById("email")?.focus();
            return;
        }

        if (!validateEmailWithState(trimmedEmail)) {
            document.getElementById("email")?.focus();
            return;
        }

        // Validate address
        if (!validateAddress()) {
            const errors = validateShippingAddress(shippingAddress, phone);
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                document.getElementById(firstErrorField)?.focus();
            }
            return;
        }

        await submitFn();
    }, [email, validateEmailWithState, validateAddress, shippingAddress, phone]);

    return {
        email,
        phone,
        shippingAddress,
        isLoading,
        error,
        emailError,
        addressErrors,
        handleEmailChange,
        handleContactPhoneChange,
        handleAddressChange,
        isFormValid: isFormValidFn,
        validateAndSubmit,
        setError,
        setIsLoading,
    };
}
