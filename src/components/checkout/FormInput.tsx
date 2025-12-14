interface FormInputProps {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    autoComplete?: string;
}

export function FormInput({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error,
    helperText,
    autoComplete,
}: FormInputProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
                {label} {required && <span className="text-red-400">*</span>}
                {!required && <span className="text-slate-400 font-normal">(Optional)</span>}
            </label>
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${error
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-white/20 focus:ring-blue-500'
                    }`}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
        </div>
    );
}
