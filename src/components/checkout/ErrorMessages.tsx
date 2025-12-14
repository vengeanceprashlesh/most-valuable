interface ErrorMessagesProps {
    errors: { [key: string]: string };
    generalError?: string;
}

export function ErrorMessages({ errors, generalError }: ErrorMessagesProps) {
    const hasErrors = Object.keys(errors).length > 0 || !!generalError;

    if (!hasErrors) return null;

    return (
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
                        {Object.values(errors).map((error, index) => (
                            <li key={index}>• {error}</li>
                        ))}
                        {generalError && <li>• {generalError}</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}
