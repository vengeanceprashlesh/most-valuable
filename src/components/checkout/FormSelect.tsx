interface FormSelectProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { code: string; name: string }[];
    required?: boolean;
    disabled?: boolean;
    error?: string;
    autoComplete?: string;
}

export function FormSelect({
    id,
    label,
    value,
    onChange,
    options,
    required = false,
    disabled = false,
    error,
    autoComplete,
}: FormSelectProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${error
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-white/20 focus:ring-blue-500'
                    }`}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
            >
                {options.map(option => (
                    <option key={option.code} value={option.code} className="bg-gray-900 text-white">
                        {option.name}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}
