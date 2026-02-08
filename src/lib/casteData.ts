// DEPRECATED: Caste detection and categorization has been disabled
// This file is kept for backward compatibility but returns empty/null values

export const CASTE_CATEGORIES = {
  OTHER: 'Other'
} as const;

/**
 * DEPRECATED: Caste detection has been disabled
 * Always returns null
 */
export function detectCasteFromName(fullName: string): {
  caste: string | null;
  confidence: 'high' | 'medium' | 'low';
} {
  return { caste: null, confidence: 'low' };
}

/**
 * DEPRECATED: Returns empty array
 */
export function getAllCasteCategories(): string[] {
  return [];
}

/**
 * DEPRECATED: Returns empty object
 */
export function getCasteStats(names: string[]): Record<string, number> {
  return {};
}
