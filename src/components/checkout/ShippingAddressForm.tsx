import { ShippingAddress, ValidationErrors } from './types';
import { US_STATES } from './constants';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';

interface ShippingAddressFormProps {
    shippingAddress: ShippingAddress;
    phone?: string;
    addressErrors: ValidationErrors;
    isLoading: boolean;
    onAddressChange: (field: keyof ShippingAddress, value: string) => void;
}

export function ShippingAddressForm({
    shippingAddress,
    phone,
    addressErrors,
    isLoading,
    onAddressChange,
}: ShippingAddressFormProps) {
    return (
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
                    <FormInput
                        id="firstName"
                        label="First Name"
                        value={shippingAddress.firstName}
                        onChange={(e) => onAddressChange('firstName', e.target.value)}
                        placeholder="John"
                        required
                        disabled={isLoading}
                        error={addressErrors.firstName}
                        autoComplete="given-name"
                    />

                    <FormInput
                        id="lastName"
                        label="Last Name"
                        value={shippingAddress.lastName}
                        onChange={(e) => onAddressChange('lastName', e.target.value)}
                        placeholder="Doe"
                        required
                        disabled={isLoading}
                        error={addressErrors.lastName}
                        autoComplete="family-name"
                    />
                </div>

                {/* Company (Optional) */}
                <FormInput
                    id="company"
                    label="Company"
                    value={shippingAddress.company || ''}
                    onChange={(e) => onAddressChange('company', e.target.value)}
                    placeholder="Acme Corp"
                    disabled={isLoading}
                    autoComplete="organization"
                />

                {/* Address Lines */}
                <FormInput
                    id="address1"
                    label="Address"
                    value={shippingAddress.address1}
                    onChange={(e) => onAddressChange('address1', e.target.value)}
                    placeholder="123 Main Street"
                    required
                    disabled={isLoading}
                    error={addressErrors.address1}
                    autoComplete="address-line1"
                />

                <FormInput
                    id="address2"
                    label="Apartment, suite, etc."
                    value={shippingAddress.address2 || ''}
                    onChange={(e) => onAddressChange('address2', e.target.value)}
                    placeholder="Apt 4B"
                    disabled={isLoading}
                    autoComplete="address-line2"
                />

                {/* City, State, Zip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                        id="city"
                        label="City"
                        value={shippingAddress.city}
                        onChange={(e) => onAddressChange('city', e.target.value)}
                        placeholder="New York"
                        required
                        disabled={isLoading}
                        error={addressErrors.city}
                        autoComplete="address-level2"
                    />

                    <FormSelect
                        id="state"
                        label="State"
                        value={shippingAddress.state}
                        onChange={(e) => onAddressChange('state', e.target.value)}
                        options={US_STATES}
                        required
                        disabled={isLoading}
                        error={addressErrors.state}
                        autoComplete="address-level1"
                    />

                    <FormInput
                        id="postalCode"
                        label="Zip Code"
                        value={shippingAddress.postalCode}
                        onChange={(e) => onAddressChange('postalCode', e.target.value)}
                        placeholder="10001"
                        required
                        disabled={isLoading}
                        error={addressErrors.postalCode}
                        autoComplete="postal-code"
                    />
                </div>

                {/* Delivery Phone */}
                <FormInput
                    id="addressPhone"
                    label="Delivery Phone"
                    type="tel"
                    value={shippingAddress.phone || phone || ''}
                    onChange={(e) => onAddressChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={isLoading}
                    error={addressErrors.phone}
                    helperText="Required for delivery updates and coordination"
                    autoComplete="tel"
                />
            </div>
        </div>
    );
}
