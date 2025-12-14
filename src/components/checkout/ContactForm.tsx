import { FormInput } from './FormInput';

interface ContactFormProps {
    email: string;
    phone: string;
    emailError?: string;
    phoneError?: string;
    isLoading: boolean;
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPhoneChange: (value: string) => void;
}

export function ContactForm({
    email,
    phone,
    emailError,
    phoneError,
    isLoading,
    onEmailChange,
    onPhoneChange,
}: ContactFormProps) {
    return (
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
                <FormInput
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={onEmailChange}
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                    error={emailError}
                    autoComplete="email"
                />

                <FormInput
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={isLoading}
                    error={phoneError}
                    helperText="Required for delivery coordination and winner notifications"
                    autoComplete="tel"
                />
            </div>
        </div>
    );
}
