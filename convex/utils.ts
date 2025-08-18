/**
 * Utility functions for the raffle system
 * These are helper functions used across different Convex functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Validate US phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Supports formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
  const phoneRegex = /^(\+?1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number (remove formatting)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Calculate bundle savings
 */
export function calculateBundleSavings(
  bundlePrice: number,
  bundleSize: number,
  pricePerEntry: number
): number {
  const regularPrice = bundleSize * pricePerEntry;
  return regularPrice - bundlePrice;
}

/**
 * Format currency amount (cents to dollars)
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if raffle is currently active
 */
export function isRaffleActive(startDate: number, endDate: number): boolean {
  const now = Date.now();
  return now >= startDate && now <= endDate;
}

/**
 * Calculate time remaining in raffle
 */
export function getTimeRemaining(endDate: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = endDate - Date.now();
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Validate raffle configuration
 */
export function validateRaffleConfig(config: {
  name: string;
  startDate: number;
  endDate: number;
  pricePerEntry: number;
  bundlePrice: number;
  bundleSize: number;
  productName: string;
}): string | null {
  if (!config.name || config.name.trim().length === 0) {
    return 'Raffle name is required';
  }

  if (!config.productName || config.productName.trim().length === 0) {
    return 'Product name is required';
  }

  if (config.startDate >= config.endDate) {
    return 'Start date must be before end date';
  }

  if (config.endDate <= Date.now()) {
    return 'End date must be in the future';
  }

  if (config.pricePerEntry <= 0) {
    return 'Price per entry must be positive';
  }

  if (config.bundlePrice <= 0) {
    return 'Bundle price must be positive';
  }

  if (config.bundleSize <= 1) {
    return 'Bundle size must be greater than 1';
  }

  if (config.bundlePrice >= config.bundleSize * config.pricePerEntry) {
    return 'Bundle price should be less than individual entries total';
  }

  return null; // No validation errors
}

/**
 * Calculate entry pricing
 */
export function calculateEntryPricing(
  count: number,
  pricePerEntry: number,
  bundleSize: number,
  bundlePrice: number,
  preferBundle: boolean = true
): {
  amount: number;
  isBundle: boolean;
  savings: number;
} {
  const regularPrice = count * pricePerEntry;
  
  // Check if this qualifies for bundle pricing
  if (preferBundle && count === bundleSize) {
    const savings = regularPrice - bundlePrice;
    return {
      amount: bundlePrice,
      isBundle: true,
      savings,
    };
  }

  return {
    amount: regularPrice,
    isBundle: false,
    savings: 0,
  };
}

/**
 * Log audit event (for important actions)
 */
export function createAuditLog(
  action: string,
  details: Record<string, any>,
  userEmail?: string,
  ipAddress?: string
): {
  action: string;
  details: string;
  userEmail?: string;
  ipAddress?: string;
  timestamp: number;
} {
  return {
    action,
    details: JSON.stringify(details),
    userEmail,
    ipAddress,
    timestamp: Date.now(),
  };
}

/**
 * Detect potentially fraudulent activity
 */
export function detectSuspiciousActivity(
  entries: Array<{
    email: string;
    ipAddress?: string;
    createdAt: number;
    count: number;
  }>
): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for too many entries from same IP
  const ipGroups = entries.reduce((acc, entry) => {
    if (entry.ipAddress) {
      acc[entry.ipAddress] = (acc[entry.ipAddress] || 0) + entry.count;
    }
    return acc;
  }, {} as Record<string, number>);

  for (const [ip, count] of Object.entries(ipGroups)) {
    if (count > 50) {
      reasons.push(`Too many entries from IP ${ip}: ${count}`);
    }
  }

  // Check for entries in rapid succession from same email
  const recentEntries = entries
    .filter(e => Date.now() - e.createdAt < 60000) // Last minute
    .reduce((acc, entry) => {
      acc[entry.email] = (acc[entry.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  for (const [email, count] of Object.entries(recentEntries)) {
    if (count > 5) {
      reasons.push(`Rapid entries from ${email}: ${count} in last minute`);
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Generate statistics summary
 */
export function generateStatsSummary(entries: Array<{
  email: string;
  count: number;
  amount: number;
  createdAt: number;
  bundle?: boolean;
}>): {
  totalEntries: number;
  totalRevenue: number;
  uniqueParticipants: number;
  averageEntriesPerPerson: number;
  bundlePurchases: number;
  regularPurchases: number;
  topParticipants: Array<{ email: string; entries: number; spent: number }>;
} {
  const uniqueParticipants = new Set(entries.map(e => e.email)).size;
  const totalEntries = entries.reduce((sum, e) => sum + e.count, 0);
  const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);
  const bundlePurchases = entries.filter(e => e.bundle).length;
  const regularPurchases = entries.length - bundlePurchases;

  // Calculate top participants
  const participantStats = entries.reduce((acc, entry) => {
    if (!acc[entry.email]) {
      acc[entry.email] = { entries: 0, spent: 0 };
    }
    acc[entry.email].entries += entry.count;
    acc[entry.email].spent += entry.amount;
    return acc;
  }, {} as Record<string, { entries: number; spent: number }>);

  const topParticipants = Object.entries(participantStats)
    .map(([email, stats]) => ({ email, ...stats }))
    .sort((a, b) => b.entries - a.entries)
    .slice(0, 10);

  return {
    totalEntries,
    totalRevenue,
    uniqueParticipants,
    averageEntriesPerPerson: uniqueParticipants > 0 ? totalEntries / uniqueParticipants : 0,
    bundlePurchases,
    regularPurchases,
    topParticipants,
  };
}
