/**
 * Maps ISO currency codes to their display symbols.
 * Used across profile view, public profile, and edit pages.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'A$',
};

export function getCurrencySymbol(code?: string | null): string {
    if (!code) return '$';
    return CURRENCY_SYMBOLS[code] || code;
}
