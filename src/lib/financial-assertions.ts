import { Prisma } from '@prisma/client';

// ============================================================================
// Financial Assertion Guardrails — Decimal-Safe Runtime Checks
//
// These are observability assertions only.
// They do NOT change business logic.
// They throw on violation to prevent silent corruption.
// ============================================================================

/**
 * Asserts a Prisma.Decimal value is non-negative.
 * Throws NEGATIVE_DECIMAL_VIOLATION on failure.
 */
export function assertDecimalNonNegative(
    value: Prisma.Decimal,
    label: string
): void {
    if (value.isNegative()) {
        throw new Error(`NEGATIVE_DECIMAL_VIOLATION: ${label} = ${value.toFixed(2)}`);
    }
}
