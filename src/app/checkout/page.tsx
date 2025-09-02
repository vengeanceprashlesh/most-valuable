"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// import PhoneInput from 'react-phone-number-input';
// import 'react-phone-number-input/style.css';
// import '../../styles/phone-input.css';
// import type { Value } from 'react-phone-number-input';

interface ShippingAddress {
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

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [addressErrors, setAddressErrors] = useState<{[key: string]: string}>({});
  
  // Product selection states
  const [productId, setProductId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [purchaseType, setPurchaseType] = useState<string>(""); // "raffle" or "direct"
  
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
  });

  useEffect(() => {
    const qtyParam = searchParams.get("quantity");
    if (qtyParam) {
      const parsedQty = parseInt(qtyParam, 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        setQuantity(parsedQty);
      }
    }
    
    // Capture product selection parameters
    const productIdParam = searchParams.get("product");
    const variantIdParam = searchParams.get("variant");
    const colorParam = searchParams.get("color");
    const sizeParam = searchParams.get("size");
    const typeParam = searchParams.get("type");
    
    if (productIdParam) setProductId(productIdParam);
    if (variantIdParam) setVariantId(variantIdParam);
    if (colorParam) setSelectedColor(colorParam);
    if (sizeParam) setSelectedSize(sizeParam);
    if (typeParam) setPurchaseType(typeParam);
  }, [searchParams]);

  // Determine if this is a direct purchase or raffle entry
  const isDirectPurchase = purchaseType === "direct" || productId === "mv-hoodie" || productId === "mv-tee";
  
  // Calculate pricing based on purchase type
  let price: number;
  let savings = "";
  let productName = "";
  
  // Define isBundle for both purchase types
  const isBundle = !isDirectPurchase && quantity === 4;
  
  if (isDirectPurchase) {
    // Direct purchase pricing
    if (productId === "mv-hoodie") {
      price = 300; // $300 for MV Members Only Hoodie
      productName = "MV Members Only Hoodie";
    } else if (productId === "mv-tee") {
      price = 175; // $175 for MV Members Only Tee
      productName = "MV Members Only Tee";
    } else {
      price = 300; // Default direct purchase price
      productName = "Direct Purchase";
    }
  } else {
    // Raffle entry pricing
    price = isBundle ? 100 : quantity * 50;
    savings = isBundle ? "Save $100!" : "";
    productName = "Gold Rush Raffle Entries";
  }

  // Email validation without state updates (pure function)
  const isEmailValid = (emailValue: string) => {
    const trimmed = emailValue.trim();
    if (!trimmed) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  // Real-time email validation with state updates
  const validateEmailWithState = (emailValue: string) => {
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
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError(""); // Clear general error when user starts typing
    
    // Only validate if user has typed something
    if (value.length > 0) {
      validateEmailWithState(value);
    } else {
      setEmailError("");
    }
  };

  // Address validation
  const validateAddress = () => {
    const errors: {[key: string]: string} = {};
    
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
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    
    // Sync phone numbers between contact and shipping forms
    if (field === 'phone') {
      setPhone(value);
      // Clear phone error from address errors when typing
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
  };

  // Sync phone from contact to shipping address
  const handleContactPhoneChange = (value: string) => {
    setPhone(value);
    setShippingAddress(prev => ({ ...prev, phone: value }));
    setError("");
    // Clear phone error when typing
    if (addressErrors.phone) {
      setAddressErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const isFormValid = () => {
    const trimmedEmail = email.trim();
    const emailValid = trimmedEmail.length > 0 && isEmailValid(trimmedEmail);
    const phoneValid = (phone || shippingAddress.phone || '').trim().length > 0;
    const addressValid = shippingAddress.firstName.trim() && 
                        shippingAddress.lastName.trim() && 
                        shippingAddress.address1.trim() && 
                        shippingAddress.city.trim() && 
                        shippingAddress.state.trim() && 
                        shippingAddress.postalCode.trim();
    return emailValid && phoneValid && addressValid && !isLoading;
  };

  async function handleCheckout(e?: React.FormEvent) {
    e?.preventDefault();
    
    console.log("🚀 Starting checkout process...");
    console.log("📧 Email:", email);
    console.log("📱 Phone:", phone);
    console.log("🔢 Quantity:", quantity);
    
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
      const firstErrorField = Object.keys(addressErrors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
        return;
      }
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      setError("Invalid quantity selected");
      return;
    }

    setIsLoading(true);
    console.log("🔄 Setting loading state...");

    try {
      console.log("📡 Making API request to /api/checkout...");
      
      const requestBody = {
        quantity,
        email: trimmedEmail.toLowerCase(),
        phone: phone || undefined,
        // Product selection data
        productId: productId || undefined,
        variantId: variantId || undefined,
        selectedColor: selectedColor || undefined,
        selectedSize: selectedSize || undefined,
        purchaseType: purchaseType || undefined,
        // Shipping address
        shippingAddress,
      };
      
      console.log("📦 Request body:", requestBody);
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ API Response:", data);
      
      if (data.url) {
        console.log("🔗 Redirecting to:", data.url);
        
        // Enhanced mobile redirect with fallback
        try {
          // For mobile devices, add a small delay to ensure proper rendering
          const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
          
          if (isMobile) {
            console.log("📱 Mobile device detected - optimizing redirect");
            setTimeout(() => {
              window.location.href = data.url;
            }, 100);
          } else {
            window.location.href = data.url;
          }
        } catch (redirectError) {
          console.error("❌ Redirect failed:", redirectError);
          // Fallback: try to open in new window
          window.open(data.url, '_self');
        }
        
        return; // Don't reset loading state since we're redirecting
      } else {
        console.error("❌ No checkout URL in response:", data);
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("❌ Checkout error:", error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Unable to connect to payment system. Please check your internet connection and try again.";
        } else if (error.message.includes('entry')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }

  // US States list for dropdown
  const usStates = [
    { code: '', name: 'Select State' },
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ];

  return (
    <main className="relative min-h-screen text-white bg-black">
      {/* Header */}
      <div className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Link href="/shop" className="inline-flex items-center mb-4">
              <Image
                src="/LogoWhite.png"
                alt="MV logo"
                width={200}
                height={56}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mx-auto">
              Provide your contact details and shipping address to ensure secure delivery of your Gold Rush collection items
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary Bar */}
      <div className="relative z-10 bg-white/5 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {isDirectPurchase ? productName : (isBundle ? "4 Entries" : `${quantity} Entry${quantity > 1 ? 's' : ''}`)}
              </h3>
              <p className="text-sm text-slate-300">{isDirectPurchase ? "Premium Collection" : "Gold Rush collection"}</p>
              {/* Product Selection Details */}
              {(selectedColor || selectedSize) && (
                <div className="mt-2 flex items-center space-x-4">
                  {selectedColor && (
                    <span className="text-xs text-slate-300">
                      <span className="text-slate-400">Color:</span> 
                      <span className="text-white font-medium capitalize ml-1">{selectedColor}</span>
                    </span>
                  )}
                  {selectedSize && (
                    <span className="text-xs text-slate-300">
                      <span className="text-slate-400">Size:</span> 
                      <span className="text-white font-medium ml-1">{selectedSize}</span>
                    </span>
                  )}
                </div>
              )}
              {savings && (
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full">
                  {savings}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${price}</div>
              {isBundle && (
                <div className="text-sm text-slate-400 line-through">$200</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Form */}
      <div className="relative z-10 min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleCheckout}>
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Left Side - Email Collection */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  
                  {/* Why Email Info */}
                  <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-300 mb-1">Why do we need your email?</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          We&apos;ll use your email to send you purchase confirmations, collection updates, and winner notifications. No spam, just essential communications.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="your@email.com"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          emailError ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                        }`}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                      {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone || shippingAddress.phone || ''}
                        onChange={(e) => handleContactPhoneChange(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          addressErrors.phone ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                        }`}
                        required
                        disabled={isLoading}
                        autoComplete="tel"
                      />
                      {addressErrors.phone && <p className="text-xs text-red-400 mt-1">{addressErrors.phone}</p>}
                      <p className="text-xs text-slate-400 mt-1">Required for delivery coordination and winner notifications</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Address Collection */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-xl font-semibold">Shipping Address</h2>
                  </div>
                  
                  {/* Address Trust Signal */}
                  <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-300 mb-1">Secure Delivery Guarantee</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Your address is encrypted and only used for prize delivery. We follow the same security standards as Amazon and other major e-commerce platforms.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={shippingAddress.firstName}
                          onChange={(e) => handleAddressChange('firstName', e.target.value)}
                          placeholder="John"
                          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            addressErrors.firstName ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                          }`}
                          required
                          disabled={isLoading}
                          autoComplete="given-name"
                        />
                        {addressErrors.firstName && <p className="text-xs text-red-400 mt-1">{addressErrors.firstName}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={shippingAddress.lastName}
                          onChange={(e) => handleAddressChange('lastName', e.target.value)}
                          placeholder="Doe"
                          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            addressErrors.lastName ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                          }`}
                          required
                          disabled={isLoading}
                          autoComplete="family-name"
                        />
                        {addressErrors.lastName && <p className="text-xs text-red-400 mt-1">{addressErrors.lastName}</p>}
                      </div>
                    </div>

                    {/* Company (Optional) */}
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                        Company <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={shippingAddress.company}
                        onChange={(e) => handleAddressChange('company', e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                        autoComplete="organization"
                      />
                    </div>

                    {/* Address Lines */}
                    <div>
                      <label htmlFor="address1" className="block text-sm font-medium text-white mb-2">
                        Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="address1"
                        value={shippingAddress.address1}
                        onChange={(e) => handleAddressChange('address1', e.target.value)}
                        placeholder="123 Main Street"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          addressErrors.address1 ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                        }`}
                        required
                        disabled={isLoading}
                        autoComplete="address-line1"
                      />
                      {addressErrors.address1 && <p className="text-xs text-red-400 mt-1">{addressErrors.address1}</p>}
                    </div>

                    <div>
                      <label htmlFor="address2" className="block text-sm font-medium text-white mb-2">
                        Apartment, suite, etc. <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="address2"
                        value={shippingAddress.address2}
                        onChange={(e) => handleAddressChange('address2', e.target.value)}
                        placeholder="Apt 4B"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                        autoComplete="address-line2"
                      />
                    </div>

                    {/* City, State, Zip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-white mb-2">
                          City <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          placeholder="New York"
                          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            addressErrors.city ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                          }`}
                          required
                          disabled={isLoading}
                          autoComplete="address-level2"
                        />
                        {addressErrors.city && <p className="text-xs text-red-400 mt-1">{addressErrors.city}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-white mb-2">
                          State <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            addressErrors.state ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                          }`}
                          required
                          disabled={isLoading}
                          autoComplete="address-level1"
                        >
                          {usStates.map(state => (
                            <option key={state.code} value={state.code} className="bg-gray-900 text-white">
                              {state.name}
                            </option>
                          ))}
                        </select>
                        {addressErrors.state && <p className="text-xs text-red-400 mt-1">{addressErrors.state}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-white mb-2">
                          Zip Code <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                          placeholder="10001"
                          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            addressErrors.postalCode ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                          }`}
                          required
                          disabled={isLoading}
                          autoComplete="postal-code"
                        />
                        {addressErrors.postalCode && <p className="text-xs text-red-400 mt-1">{addressErrors.postalCode}</p>}
                      </div>
                    </div>

                    {/* Delivery Phone (Mandatory - synced with contact phone) */}
                    <div>
                      <label htmlFor="addressPhone" className="block text-sm font-medium text-white mb-2">
                        Delivery Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        id="addressPhone"
                        value={shippingAddress.phone || phone || ''}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          addressErrors.phone ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                        }`}
                        required
                        disabled={isLoading}
                        autoComplete="tel"
                      />
                      {addressErrors.phone && <p className="text-xs text-red-400 mt-1">{addressErrors.phone}</p>}
                      <p className="text-xs text-slate-400 mt-1">Required for delivery updates and coordination</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {(error || Object.keys(addressErrors).length > 0) && (
              <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 max-w-4xl mx-auto">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-300 mb-1">Please fix the following errors:</h4>
                    <ul className="text-sm text-red-200 space-y-1">
                      {Object.values(addressErrors).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {error && <li>• {error}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 max-w-md mx-auto">
              <button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className={`w-full px-8 py-4 font-semibold rounded-lg transition-all duration-200 ${
                  isLoading || !isFormValid()
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Complete Purchase - $${price}`
                )}
              </button>
              
              {/* Trust Signals */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                    </svg>
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Powered by Stripe</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Back to Shop */}
      <div className="relative z-10 text-center pb-8">
        <Link href="/shop" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to shop
        </Link>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
